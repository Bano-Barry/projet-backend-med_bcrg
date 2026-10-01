/**
 * @file patients.service.ts
 * @description Logique metier du module de gestion des employes et des allergies.
 */

import { UserRole, AllergyType, AllergySeverity } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors';
import { AuthenticatedUser } from '../../core/types/auth.types';
import { hashPassword } from '../../core/utils/security';

export interface CreatePatientInput {
  matricule: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender: 'M' | 'F';
  department: string;
  jobTitle: string;
  bloodGroup?: string;
  medicalHistory?: string;
}

export interface UpdatePatientInput {
  phone?: string;
  department?: string;
  jobTitle?: string;
  bloodGroup?: string;
  medicalHistory?: string;
}

export interface AddAllergyInput {
  allergyType: AllergyType;
  substance: string;
  reactionDetails?: string;
  severity?: AllergySeverity;
}

export class PatientsService {
  /**
   * Enrole un nouveau collaborateur employe au sein de la BCRG.
   * Cree le compte utilisateur associe si necessaire au sein d'une transaction atomique.
   *
   * @param data Donnees d'enrolement du collaborateur et de sa fiche
   * @returns La fiche employe nouvellement creee avec les informations du compte
   */
  async createPatient(data: CreatePatientInput) {
    const matriculeTrimmed = data.matricule.trim();
    const cleanEmail = data.email ? data.email.trim() : null;
    const cleanPhone = data.phone ? data.phone.trim() : null;

    // 1. Verification de l'existence prealable d'une fiche pour ce matricule
    const existingPatient = await prisma.patient.findUnique({
      where: { registrationNumber: matriculeTrimmed },
    });

    if (existingPatient) {
      throw new ConflictError(
        `Un employé existe déjà pour le matricule ${matriculeTrimmed}`
      );
    }

    // 2. Verification de l'unicite de l'adresse email
    if (cleanEmail) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUserWithEmail && existingUserWithEmail.matricule !== matriculeTrimmed) {
        throw new ConflictError(
          `L'adresse email (${cleanEmail}) est déjà associée à un autre employé.`
        );
      }
    }

    // 3. Verification de l'unicite du numero de telephone
    if (cleanPhone) {
      const existingUserWithPhone = await prisma.user.findFirst({
        where: { phone: cleanPhone },
      });

      if (existingUserWithPhone && existingUserWithPhone.matricule !== matriculeTrimmed) {
        throw new ConflictError(
          `Le numéro de téléphone (${cleanPhone}) est déjà associé à un autre employé.`
        );
      }

      const existingPatientWithPhone = await prisma.patient.findFirst({
        where: { phone: cleanPhone },
      });

      if (
        existingPatientWithPhone &&
        existingPatientWithPhone.registrationNumber !== matriculeTrimmed
      ) {
        throw new ConflictError(
          `Le numéro de téléphone (${cleanPhone}) est déjà associé à un autre employé.`
        );
      }
    }

    // 4. Preparation du mot de passe temporaire par defaut en dehors de la transaction
    const defaultPasswordHash = await hashPassword('ChangeMe@2026!');

    // 5. Verification ou creation atomique du compte utilisateur et de la fiche employe
    return prisma.$transaction(
      async (tx) => {
        let user = await tx.user.findUnique({
          where: { matricule: matriculeTrimmed },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              matricule: matriculeTrimmed,
              email: cleanEmail,
              passwordHash: defaultPasswordHash,
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              role: UserRole.EMPLOYEE,
              phone: cleanPhone,
              isFirstLogin: true,
              isActive: true,
            },
          });
        } else {
          // Synchronisation du telephone ou de l'email sur le compte existant si non renseignes
          const userUpdates: { phone?: string; email?: string } = {};
          if (cleanPhone && !user.phone) {
            userUpdates.phone = cleanPhone;
          }
          if (cleanEmail && !user.email) {
            userUpdates.email = cleanEmail;
          }

          if (Object.keys(userUpdates).length > 0) {
            user = await tx.user.update({
              where: { id: user.id },
              data: userUpdates,
            });
          }
        }

        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            registrationNumber: matriculeTrimmed,
            gender: data.gender,
            phone: cleanPhone,
            department: data.department.trim(),
            jobTitle: data.jobTitle.trim(),
            bloodGroup: data.bloodGroup || null,
            medicalHistory: data.medicalHistory ? data.medicalHistory.trim() : null,
          },
          include: {
            user: {
              select: {
                id: true,
                matricule: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isFirstLogin: true,
              },
            },
            allergies: true,
          },
        });

        return patient;
      },
      {
        maxWait: 10000,
        timeout: 25000,
      }
    );
  }

  /**
   * Recherche et liste les employes avec pagination et filtres multi-criteres.
   *
   * @param params Criteres de recherche, filtre par service et parametres de pagination
   * @returns Liste paginee des employes
   */
  async listPatients(params: {
    search?: string;
    department?: string;
    page: number;
    limit: number;
  }) {
    const page = Math.max(1, params.page);
    const limit = Math.max(1, Math.min(10, params.limit));
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (params.department) {
      whereClause.department = {
        contains: params.department,
        mode: 'insensitive',
      };
    }

    if (params.search) {
      const searchTerms = params.search.trim();
      whereClause.OR = [
        { registrationNumber: { contains: searchTerms, mode: 'insensitive' } },
        { department: { contains: searchTerms, mode: 'insensitive' } },
        { jobTitle: { contains: searchTerms, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: searchTerms, mode: 'insensitive' } },
              { lastName: { contains: searchTerms, mode: 'insensitive' } },
              { matricule: { contains: searchTerms, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where: whereClause }),
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              matricule: true,
              role: true,
            },
          },
          allergies: {
            select: {
              id: true,
              allergyType: true,
              substance: true,
              severity: true,
            },
          },
          _count: {
            select: {
              consultations: true,
              medicalDocuments: true,
            },
          },
        },
      }),
    ]);

    return {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recupere la fiche employe complete par son identifiant.
   * Controle les permissions d'acces (protection BOLA/IDOR).
   *
   * @param patientId Identifiant unique de l'employe (UUID)
   * @param currentUser Utilisateur authentifie effectuant la requete
   * @returns Fiche employe detaillee avec coordonnees et allergies
   */
  async getPatientById(patientId: string, currentUser: AuthenticatedUser) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            isActive: true,
          },
        },
        allergies: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Employé introuvable');
    }

    // Protection BOLA : si l'utilisateur est un simple employe, il ne peut voir que sa propre fiche
    if (currentUser.role === UserRole.EMPLOYEE && patient.userId !== currentUser.id) {
      throw new ForbiddenError(
        'Acces refuse : vous n\'etes pas autorise a consulter les informations d\'un tiers'
      );
    }

    return patient;
  }

  /**
   * Recupere la fiche employe rattachee au compte de l'utilisateur connecte.
   *
   * @param userId Identifiant du compte utilisateur
   * @returns Fiche de l'employe connecte
   */
  async getMyPatientProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        allergies: true,
      },
    });

    if (!patient) {
      throw new NotFoundError(
        'Aucun employé n\'est encore associé à votre compte. Veuillez contacter les ressources humaines.'
      );
    }

    return patient;
  }

  /**
   * Met a jour les informations administratives ou les coordonnees de l'employe.
   *
   * @param patientId Identifiant unique de l'employe
   * @param data Champs a mettre a jour
   * @returns Fiche employe mise a jour
   */
  async updatePatient(patientId: string, data: UpdatePatientInput) {
    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existing) {
      throw new NotFoundError('Employé introuvable');
    }

    const cleanPhone =
      data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : undefined;

    // Verification d'unicite du nouveau telephone s'il est modifie
    if (cleanPhone) {
      const conflictPatient = await prisma.patient.findFirst({
        where: { phone: cleanPhone },
      });

      if (conflictPatient && conflictPatient.id !== patientId) {
        throw new ConflictError(
          `Le numero de telephone (${cleanPhone}) est deja associe a un autre employe.`
        );
      }

      const conflictUser = await prisma.user.findFirst({
        where: { phone: cleanPhone },
      });

      if (conflictUser && conflictUser.id !== existing.userId) {
        throw new ConflictError(
          `Le numero de telephone (${cleanPhone}) est deja associe a un autre compte utilisateur.`
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      // Synchronisation du telephone sur le compte utilisateur associe
      if (cleanPhone !== undefined && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { phone: cleanPhone },
        });
      }

      const updated = await tx.patient.update({
        where: { id: patientId },
        data: {
          phone: cleanPhone,
          department: data.department !== undefined ? data.department.trim() : undefined,
          jobTitle: data.jobTitle !== undefined ? data.jobTitle.trim() : undefined,
          bloodGroup: data.bloodGroup !== undefined ? (data.bloodGroup || null) : undefined,
          medicalHistory: data.medicalHistory !== undefined ? (data.medicalHistory ? data.medicalHistory.trim() : null) : undefined,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              matricule: true,
              email: true,
              phone: true,
            },
          },
          allergies: true,
        },
      });

      return updated;
    },
    {
      maxWait: 10000,
      timeout: 25000,
    });
  }

  /**
   * Enregistre une nouvelle allergie sur la fiche de l'employe.
   *
   * @param patientId Identifiant de l'employe
   * @param data Details de l'allergie (type, substance, severite)
   * @returns L'allergie creee
   */
  async addAllergy(patientId: string, data: AddAllergyInput) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundError('Employé introuvable');
    }

    const allergy = await prisma.patientAllergy.create({
      data: {
        patientId,
        allergyType: data.allergyType,
        substance: data.substance.trim(),
        reactionDetails: data.reactionDetails ? data.reactionDetails.trim() : null,
        severity: data.severity || AllergySeverity.MODERATE,
      },
    });

    return allergy;
  }

  /**
   * Supprime une allergie de la fiche employe.
   *
   * @param patientId Identifiant de l'employe
   * @param allergyId Identifiant de l'allergie a supprimer
   */
  async deleteAllergy(patientId: string, allergyId: string) {
    const allergy = await prisma.patientAllergy.findFirst({
      where: {
        id: allergyId,
        patientId,
      },
    });

    if (!allergy) {
      throw new NotFoundError('Allergie introuvable pour cet employe');
    }

    await prisma.patientAllergy.delete({
      where: { id: allergyId },
    });

    return { message: 'Allergie retirée pour cet employé avec succès.' };
  }
}

export const patientsService = new PatientsService();
