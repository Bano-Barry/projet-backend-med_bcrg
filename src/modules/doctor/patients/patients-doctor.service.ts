/**
 * @file patients-doctor.service.ts
 * @description Logique metier du dossier medical et de la recherche patient dediee au medecin.
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { NotFoundError } from '../../../core/errors';
import { calculateBmi } from '../../../core/utils/clinical';

export class PatientsDoctorService {
  /**
   * Recherche rapide de patients pour autocompletion dans le formulaire de consultation.
   *
   * @param query Texte de recherche (matricule, nom, prenom, departement)
   * @param limit Nombre maximal de resultats retournes
   * @returns Liste allegee de patients correspondants
   */
  async searchPatients(query: string, limit: number = 10) {
    const q = query.trim();
    if (!q) {
      return [];
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { registrationNumber: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
          { jobTitle: { contains: q, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { matricule: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      take: Math.max(1, Math.min(50, limit)),
      orderBy: { registrationNumber: 'asc' },
      select: {
        id: true,
        registrationNumber: true,
        gender: true,
        department: true,
        jobTitle: true,
        bloodGroup: true,
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
      },
    });

    return patients.map((p) => ({
      id: p.id,
      registrationNumber: p.registrationNumber,
      matricule: p.user.matricule,
      fullName: `${p.user.firstName} ${p.user.lastName}`,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      gender: p.gender,
      department: p.department,
      jobTitle: p.jobTitle,
      phone: p.user.phone,
      bloodGroup: p.bloodGroup,
    }));
  }

  /**
   * Recupere l'integralite du dossier medical d'un patient pour affichage dans l'onglet "Dossier Medical".
   *
   * @param patientId Identifiant unique du patient
   * @returns Dossier medical exhaustif : coordonnees, antecedents, allergies, consultations, constantes
   */
  async getMedicalRecord(patientId: string) {
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
            phone: true,
            isActive: true,
          },
        },
        allergies: {
          orderBy: { createdAt: 'desc' },
        },
        consultations: {
          orderBy: { consultationDate: 'desc' },
          take: 20,
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            prescriptions: true,
          },
        },
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Dossier patient introuvable');
    }

    const formattedVitals = patient.vitalSigns.map((v) => {
      let bmiData = null;
      if (v.weightKg && v.heightCm) {
        bmiData = calculateBmi(Number(v.weightKg), Number(v.heightCm));
      }

      return {
        ...v,
        weightKg: v.weightKg ? Number(v.weightKg) : null,
        heightCm: v.heightCm ? Number(v.heightCm) : null,
        temperatureC: v.temperatureC ? Number(v.temperatureC) : null,
        bmi: v.bmi ? Number(v.bmi) : (bmiData ? bmiData.bmi : null),
        bmiLabel: bmiData ? bmiData.label : null,
      };
    });

    return {
      id: patient.id,
      registrationNumber: patient.registrationNumber,
      gender: patient.gender,
      department: patient.department,
      jobTitle: patient.jobTitle,
      bloodGroup: patient.bloodGroup,
      medicalHistory: patient.medicalHistory,
      createdAt: patient.createdAt,
      user: patient.user,
      allergies: patient.allergies,
      consultations: patient.consultations.map((c) => ({
        id: c.id,
        date: c.consultationDate,
        type: c.type,
        status: c.status,
        reason: c.reason,
        symptoms: c.symptoms,
        diagnosis: c.diagnosis,
        advice: c.advice,
        doctorName: `Dr. ${c.doctor.firstName} ${c.doctor.lastName}`,
        prescriptionsCount: c.prescriptions.length,
      })),
      vitalSignsHistory: formattedVitals,
    };
  }
}

export const patientsDoctorService = new PatientsDoctorService();
