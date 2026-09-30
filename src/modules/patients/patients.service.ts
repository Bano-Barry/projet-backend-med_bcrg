/**
 * @file patients.service.ts
 * @description Logique metier du module de gestion des dossiers collaborateurs et des allergies.
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
   * Enrole un nouveau collaborateur patient au sein du systeme medical de la BCRG.
   * Cree le compte utilisateur associe si necessaire au sein d'une transaction atomique.
   *
   * @param data Donnees d'enrolement du collaborateur et du dossier
   * @returns Le dossier patient nouvellement cree avec les informations du compte
   */
  async createPatient(data: CreatePatientInput) {
    const matriculeTrimmed = data.matricule.trim();
    const cleanEmail = data.email ? data.email.trim() : null;
    const cleanPhone = data.phone ? data.phone.trim() : null;

    // 1. Verification de l'existence prealable d'un dossier pour ce matricule
    const existingPatient = await prisma.patient.findUnique({
      where: { registrationNumber: matriculeTrimmed },
    });

    if (existingPatient) {
      throw new ConflictError(
        `Un dossier medical existe deja pour le matricule BCRG ${matriculeTrimmed}`
      );
    }

    // 2. Verification de l'unicite de l'adresse email
    if (cleanEmail) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUserWithEmail && existingUserWithEmail.matricule !== matriculeTrimmed) {
        throw new ConflictError(
          `L'adresse email (${cleanEmail}) est deja associee a un autre collaborateur.`
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
          `Le numero de telephone (${cleanPhone}) est deja associe a un autre compte utilisateur.`
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
          `Le numero de telephone (${cleanPhone}) est deja associe a un autre dossier patient.`
        );
      }
    }

    // 4. Verification ou creation atomique du compte utilisateur et du dossier patient
    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { matricule: matriculeTrimmed },
      });

      if (!user) {
        // Mot de passe temporaire attribue par defaut au nouveau collaborateur
        const defaultPasswordHash = await hashPassword('ChangeMe@2026!');

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
    });
  }

  /**
   * Recherche et liste les patients avec pagination et filtres multi-criteres.
   *
   * @param params Criteres de recherche, filtre par service et parametres de pagination
   * @returns Liste paginee des dossiers patients
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
   * Recupere le dossier patient complet par son identifiant.
   * Controle les permissions d'acces (secret medical et protection BOLA/IDOR).
   *
   * @param patientId Identifiant unique du dossier patient (UUID)
   * @param currentUser Utilisateur authentifie effectuant la requete
   * @returns Fiche patient detaillee avec antecedents et allergies
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
      throw new NotFoundError('Dossier patient introuvable');
    }

    // Protection BOLA : si l'utilisateur est un simple employe, il ne peut voir que sa propre fiche
    if (currentUser.role === UserRole.EMPLOYEE && patient.userId !== currentUser.id) {
      throw new ForbiddenError(
        'Acces refuse : vous n\'etes pas autorisé a consulter le dossier d\'un tiers'
      );
    }

    return patient;
  }

  /**
   * Recupere la fiche patient rattachee au compte de l'utilisateur connecte.
   *
   * @param userId Identifiant du compte utilisateur
   * @returns Dossier patient de l'utilisateur
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
        'Aucun dossier medical n\'est encore associé a votre compte. Veuillez contacter l\'infirmerie.'
      );
    }

    return patient;
  }

  /**
   * Met a jour les informations administratives ou les antecedents du patient.
   *
   * @param patientId Identifiant unique du patient
   * @param data Champs a mettre a jour
   * @returns Dossier patient mis a jour
   */
  async updatePatient(patientId: string, data: UpdatePatientInput) {
    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existing) {
      throw new NotFoundError('Dossier patient introuvable');
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
          `Le numero de telephone (${cleanPhone}) est deja associe a un autre patient.`
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
    });
  }

  /**
   * Enregistre une nouvelle allergie au dossier medical du patient.
   *
   * @param patientId Identifiant du patient
   * @param data Details de l'allergie (type, substance, severite)
   * @returns L'allergie creee
   */
  async addAllergy(patientId: string, data: AddAllergyInput) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundError('Dossier patient introuvable');
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
   * Supprime une allergie du dossier patient.
   *
   * @param patientId Identifiant du patient
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
      throw new NotFoundError('Allergie introuvable pour ce patient');
    }

    await prisma.patientAllergy.delete({
      where: { id: allergyId },
    });

    return { message: 'Allergie retiree du dossier avec succes.' };
  }
}

export const patientsService = new PatientsService();
