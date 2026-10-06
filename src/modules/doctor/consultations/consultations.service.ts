/**
 * @file consultations.service.ts
 * @description Logique metier du module Consultations Cliniques reserve au personnel soignant (DOCTOR).
 */

import { ConsultationStatus, ConsultationType, Prisma } from '@prisma/client';
import { prisma } from '../../../infrastructure/database/prisma';
import { NotFoundError, BadRequestError } from '../../../core/errors';
import {
  calculateBmi,
  parseBloodPressure,
  isVitalSignAbnormal,
} from '../../../core/utils/clinical';
import {
  VitalSignsInput,
  CreateConsultationInput,
  UpdateConsultationInput,
  AddPrescriptionInput,
  ConsultationListQueryParams,
} from './types/consultations.types';

export class DoctorConsultationsService {
  /**
   * Recupere les statistiques de consultations pour les cartes KPI de l'interface medecin.
   *
   * @param doctorId Identifiant unique du medecin connecte
   * @returns Compteurs KPI : consultations du mois, urgences recentes, en attente / en cours aujourd'hui
   */
  async getConsultationStats(doctorId?: string) {
    const now = new Date();

    // Debut du mois courant (ex: 01/10/2026 00:00:00)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Debut de la journee courante (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Fin de la journee courante (23:59:59)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [consultationsThisMonth, recentEmergencies, waitingOrInProgressToday] =
      await Promise.all([
        // 1. Consultations realisees ce mois-ci
        prisma.consultation.count({
          where: {
            consultationDate: { gte: startOfMonth },
          },
        }),

        // 2. Urgences recentes (ce mois)
        prisma.consultation.count({
          where: {
            type: ConsultationType.INSTANT,
            consultationDate: { gte: startOfMonth },
          },
        }),

        // 3. En attente ou en cours aujourd'hui
        prisma.consultation.count({
          where: {
            consultationDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              in: [ConsultationStatus.WAITING, ConsultationStatus.IN_PROGRESS],
            },
          },
        }),
      ]);

    return {
      consultationsThisMonth,
      recentEmergencies,
      waitingOrInProgressToday,
    };
  }

  /**
   * Recherche et liste les consultations avec pagination, filtres par type, statut et date.
   */
  async listConsultations(params: ConsultationListQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ConsultationWhereInput = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.date) {
      const targetDate = new Date(params.date);
      if (!isNaN(targetDate.getTime())) {
        const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        where.consultationDate = { gte: start, lte: end };
      }
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { reason: { contains: q, mode: 'insensitive' } },
        { diagnosis: { contains: q, mode: 'insensitive' } },
        { symptoms: { contains: q, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { registrationNumber: { contains: q, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                    { matricule: { contains: q, mode: 'insensitive' } },
                    { department: { contains: q, mode: 'insensitive' } },
                    { jobTitle: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.consultation.count({ where }),
      prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consultationDate: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              registrationNumber: true,
              gender: true,
              bloodGroup: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  matricule: true,
                  email: true,
                  phone: true,
                  department: true,
                  jobTitle: true,
                },
              },
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          vitalSigns: {
            orderBy: { measuredAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              prescriptions: true,
            },
          },
        },
      }),
    ]);

    // Formatage adapte aux besoins de l'affichage UI
    const formattedItems = items.map((c) => {
      const latestVitals = c.vitalSigns[0] || null;
      let bmiData = null;

      if (latestVitals && latestVitals.weightKg && latestVitals.heightCm) {
        bmiData = calculateBmi(
          Number(latestVitals.weightKg),
          Number(latestVitals.heightCm)
        );
      }

      return {
        id: c.id,
        consultationDate: c.consultationDate,
        type: c.type,
        status: c.status,
        reason: c.reason,
        symptoms: c.symptoms,
        diagnosis: c.diagnosis,
        advice: c.advice,
        patient: {
          id: c.patient.id,
          registrationNumber: c.patient.registrationNumber,
          gender: c.patient.gender,
          department: c.patient.user.department,
          jobTitle: c.patient.user.jobTitle,
          firstName: c.patient.user.firstName,
          lastName: c.patient.user.lastName,
          matricule: c.patient.user.matricule,
          phone: c.patient.user.phone,
        },
        doctor: {
          id: c.doctor.id,
          name: `Dr. ${c.doctor.firstName} ${c.doctor.lastName}`,
        },
        vitalSigns: latestVitals
          ? {
            ...latestVitals,
            weightKg: latestVitals.weightKg ? Number(latestVitals.weightKg) : null,
            heightCm: latestVitals.heightCm ? Number(latestVitals.heightCm) : null,
            temperatureC: latestVitals.temperatureC ? Number(latestVitals.temperatureC) : null,
            bmi: latestVitals.bmi ? Number(latestVitals.bmi) : (bmiData ? bmiData.bmi : null),
            bmiCategory: bmiData ? bmiData.label : null,
            bloodGroup: c.patient.bloodGroup,
          }
          : null,
        prescriptionsCount: c._count.prescriptions,
      };
    });

    return {
      data: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recupere le detail complet d'une consultation (pour affichage dans le tiroir / drawer).
   */
  async getConsultationById(id: string) {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                matricule: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            allergies: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
        },
        prescriptions: {
          orderBy: { createdAt: 'asc' },
        },
        sickLeave: true,
      },
    });

    if (!consultation) {
      throw new NotFoundError('Consultation introuvable');
    }

    const latestVitals = consultation.vitalSigns[0] || null;
    let bmiInfo = null;

    if (latestVitals && latestVitals.weightKg && latestVitals.heightCm) {
      bmiInfo = calculateBmi(
        Number(latestVitals.weightKg),
        Number(latestVitals.heightCm)
      );
    }

    return {
      ...consultation,
      vitalSigns: consultation.vitalSigns.map((v) => ({
        ...v,
        weightKg: v.weightKg ? Number(v.weightKg) : null,
        heightCm: v.heightCm ? Number(v.heightCm) : null,
        temperatureC: v.temperatureC ? Number(v.temperatureC) : null,
        bmi: v.bmi ? Number(v.bmi) : null,
      })),
      latestVitalsSummary: latestVitals
        ? {
          temperatureC: latestVitals.temperatureC ? Number(latestVitals.temperatureC) : null,
          bloodPressure:
            latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic
              ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
              : null,
          heightCm: latestVitals.heightCm ? Number(latestVitals.heightCm) : null,
          weightKg: latestVitals.weightKg ? Number(latestVitals.weightKg) : null,
          bmi: bmiInfo ? bmiInfo.bmi : (latestVitals.bmi ? Number(latestVitals.bmi) : null),
          bmiLabel: bmiInfo ? bmiInfo.label : null,
          bloodGroup: consultation.patient.bloodGroup,
          isAbnormal: latestVitals.isAbnormal,
        }
        : null,
    };
  }

  /**
   * Demarre une nouvelle consultation avec constantes vitales initiales au sein d'une transaction atomique.
   */
  async createConsultation(doctorId: string, input: CreateConsultationInput) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
    });

    if (!patient) {
      throw new NotFoundError('Patient introuvable pour démarrer la consultation');
    }

    // Traitement et preparation des constantes
    let systolic: number | null = null;
    let diastolic: number | null = null;

    if (input.vitals) {
      if (input.vitals.bloodPressure) {
        const parsed = parseBloodPressure(input.vitals.bloodPressure);
        systolic = parsed.systolic ?? null;
        diastolic = parsed.diastolic ?? null;
      } else {
        systolic = input.vitals.bloodPressureSystolic ?? null;
        diastolic = input.vitals.bloodPressureDiastolic ?? null;
      }
    }

    const weight = input.vitals?.weightKg ?? null;
    const height = input.vitals?.heightCm ?? null;
    const temp = input.vitals?.temperatureC ?? null;

    let computedBmi: number | null = null;
    if (weight && height) {
      const res = calculateBmi(weight, height);
      if (res) computedBmi = res.bmi;
    }

    const hasVitals =
      weight !== null ||
      height !== null ||
      temp !== null ||
      systolic !== null ||
      diastolic !== null ||
      input.vitals?.respiratoryRate !== undefined ||
      input.vitals?.bloodGroup !== undefined;

    const isAbnormal = hasVitals
      ? isVitalSignAbnormal({
        temperatureC: temp,
        bloodPressureSystolic: systolic,
        bloodPressureDiastolic: diastolic,
      })
      : false;

    return prisma.$transaction(async (tx) => {
      // Si le groupe sanguin est renseigne dans les constantes, on met a jour le dossier patient
      if (input.vitals?.bloodGroup && input.vitals.bloodGroup.trim() !== '') {
        await tx.patient.update({
          where: { id: input.patientId },
          data: { bloodGroup: input.vitals.bloodGroup.trim() },
        });
      }

      const consultation = await tx.consultation.create({
        data: {
          patientId: input.patientId,
          doctorId,
          type: input.type || ConsultationType.GENERAL,
          status: ConsultationStatus.IN_PROGRESS,
          reason: input.reason.trim(),
          symptoms: input.symptoms ? input.symptoms.trim() : input.reason.trim(),
          physicalExamination: input.physicalExamination ? input.physicalExamination.trim() : null,
          diagnosis: input.diagnosis ? input.diagnosis.trim() : null,
          advice: input.advice ? input.advice.trim() : null,
        },
      });

      if (hasVitals) {
        await tx.vitalSign.create({
          data: {
            consultationId: consultation.id,
            patientId: input.patientId,
            weightKg: weight !== null ? new Prisma.Decimal(weight) : null,
            heightCm: height !== null ? new Prisma.Decimal(height) : null,
            bmi: computedBmi !== null ? new Prisma.Decimal(computedBmi) : null,
            temperatureC: temp !== null ? new Prisma.Decimal(temp) : null,
            bloodPressureSystolic: systolic,
            bloodPressureDiastolic: diastolic,
            respiratoryRate: input.vitals?.respiratoryRate ?? null,
            isAbnormal,
          },
        });
      }

      return tx.consultation.findUnique({
        where: { id: consultation.id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  matricule: true,
                },
              },
            },
          },
          vitalSigns: true,
        },
      });
    });
  }

  /**
   * Met a jour une consultation (diagnostic, examen clinique, statut TERMINEE).
   */
  async updateConsultation(id: string, input: UpdateConsultationInput) {
    const existing = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Consultation introuvable');
    }

    return prisma.$transaction(async (tx) => {
      // Si le groupe sanguin est renseigne, synchronisation avec le patient
      if (input.vitals?.bloodGroup && input.vitals.bloodGroup.trim() !== '') {
        await tx.patient.update({
          where: { id: existing.patientId },
          data: { bloodGroup: input.vitals.bloodGroup.trim() },
        });
      }

      // 1. Mise a jour des constantes si specifiees
      if (input.vitals) {
        let systolic: number | null = null;
        let diastolic: number | null = null;

        if (input.vitals.bloodPressure) {
          const parsed = parseBloodPressure(input.vitals.bloodPressure);
          systolic = parsed.systolic ?? null;
          diastolic = parsed.diastolic ?? null;
        } else {
          systolic = input.vitals.bloodPressureSystolic ?? null;
          diastolic = input.vitals.bloodPressureDiastolic ?? null;
        }

        const weight = input.vitals.weightKg ?? null;
        const height = input.vitals.heightCm ?? null;
        const temp = input.vitals.temperatureC ?? null;

        let computedBmi: number | null = null;
        if (weight && height) {
          const res = calculateBmi(weight, height);
          if (res) computedBmi = res.bmi;
        }

        const isAbnormal = isVitalSignAbnormal({
          temperatureC: temp,
          bloodPressureSystolic: systolic,
          bloodPressureDiastolic: diastolic,
        });

        await tx.vitalSign.create({
          data: {
            consultationId: id,
            patientId: existing.patientId,
            weightKg: weight !== null ? new Prisma.Decimal(weight) : null,
            heightCm: height !== null ? new Prisma.Decimal(height) : null,
            bmi: computedBmi !== null ? new Prisma.Decimal(computedBmi) : null,
            temperatureC: temp !== null ? new Prisma.Decimal(temp) : null,
            bloodPressureSystolic: systolic,
            bloodPressureDiastolic: diastolic,
            respiratoryRate: input.vitals.respiratoryRate ?? null,
            isAbnormal,
          },
        });
      }

      // 2. Mise a jour de la consultation
      const updated = await tx.consultation.update({
        where: { id },
        data: {
          status: input.status,
          type: input.type,
          reason: input.reason !== undefined ? input.reason.trim() : undefined,
          symptoms: input.symptoms !== undefined ? input.symptoms.trim() : undefined,
          physicalExamination:
            input.physicalExamination !== undefined
              ? (input.physicalExamination ? input.physicalExamination.trim() : null)
              : undefined,
          diagnosis:
            input.diagnosis !== undefined
              ? (input.diagnosis ? input.diagnosis.trim() : null)
              : undefined,
          advice:
            input.advice !== undefined
              ? (input.advice ? input.advice.trim() : null)
              : undefined,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  matricule: true,
                },
              },
            },
          },
          vitalSigns: {
            orderBy: { measuredAt: 'desc' },
          },
          prescriptions: true,
        },
      });

      return updated;
    });
  }

  /**
   * Ajoute une  a une consultation.
   */
  async addPrescription(consultationId: string, input: AddPrescriptionInput) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundError('Consultation introuvable');
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        medicationName: input.medicationName.trim(),
        dosage: input.dosage.trim(),
        frequency: input.frequency ? input.frequency.trim() : null,
        duration: input.duration.trim(),
        instructions: input.instructions ? input.instructions.trim() : null,
      },
    });

    return prescription;
  }

  /**
   * Supprime une prescription de l'ordonnance.
   */
  async deletePrescription(consultationId: string, prescriptionId: string) {
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        consultationId,
      },
    });

    if (!prescription) {
      throw new NotFoundError('Prescription introuvable pour cette consultation');
    }

    await prisma.prescription.delete({
      where: { id: prescriptionId },
    });

    return { message: 'Prescription retiree de l\'ordonnance avec succes.' };
  }
}

export const doctorConsultationsService = new DoctorConsultationsService();
