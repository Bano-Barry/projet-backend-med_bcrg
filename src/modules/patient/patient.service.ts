/**
 * @file patient.service.ts
 * @description Logique metier de l'Espace Sante Collaborateur / Patient.
 * Fournit l'historique des constantes vitales, la gestion des documents et le televersement securise.
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../../infrastructure/database/prisma';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { calculateBmi } from '../../core/utils/clinical';
import { env } from '../../config/env';
import {
  PatientVitalSignItem,
  PatientVitalsSummary,
  PatientDocumentItem,
  PatientUploadDocumentInput,
} from './patient.types';

export class PatientService {
  private uploadsBaseDir: string;

  constructor() {
    this.uploadsBaseDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadsBaseDir)) {
      fs.mkdirSync(this.uploadsBaseDir, { recursive: true });
    }
  }

  /**
   * Recupere l'enregistrement Patient associe au compte utilisateur connecte.
   */
  private async getPatientByUserId(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError(
        'Aucune fiche médicale de collaborateur n\'est associée à votre compte. Veuillez contacter l\'infirmerie ou les RH.'
      );
    }

    return patient;
  }

  /**
   * Recupere l'historique complet des constantes vitales du collaborateur.
   */
  async getMyVitals(userId: string): Promise<{
    summary: PatientVitalsSummary | null;
    history: PatientVitalSignItem[];
  }> {
    const patient = await this.getPatientByUserId(userId);

    const vitals = await prisma.vitalSign.findMany({
      where: { patientId: patient.id },
      orderBy: { measuredAt: 'desc' },
      include: {
        consultation: {
          select: {
            consultationDate: true,
          },
        },
      },
    });

    const history: PatientVitalSignItem[] = vitals.map((v) => {
      let bmiData = null;
      if (v.weightKg && v.heightCm) {
        bmiData = calculateBmi(Number(v.weightKg), Number(v.heightCm));
      }

      return {
        id: v.id,
        consultationId: v.consultationId,
        measuredAt: v.measuredAt,
        bloodPressure: v.bloodPressure,
        temperatureC: v.temperatureC ? Number(v.temperatureC) : null,
        weightKg: v.weightKg ? Number(v.weightKg) : null,
        heightCm: v.heightCm ? Number(v.heightCm) : null,
        bmi: v.bmi ? Number(v.bmi) : (bmiData ? bmiData.bmi : null),
        bmiLabel: bmiData ? bmiData.label : null,
        bloodGroup: patient.bloodGroup,
      };
    });

    // Dernieres constantes (pour affichage de la carte de l'UI)
    const latest = history[0] || null;
    const summary: PatientVitalsSummary | null = latest
      ? {
        bloodPressure: latest.bloodPressure,
        weightKg: latest.weightKg,
        heightCm: latest.heightCm,
        temperatureC: latest.temperatureC,
        bmi: latest.bmi,
        bmiLabel: latest.bmiLabel,
        bloodGroup: patient.bloodGroup,
        lastVisitDate: latest.measuredAt,
      }
      : null;

    return {
      summary,
      history,
    };
  }

  /**
   * Recupere la liste de tous les documents du patient :
   * - Ordonnances et comptes rendus generes par le medecin
   * - Documents de sante televerses par le collaborateur lui-meme
   */
  async getMyDocuments(userId: string): Promise<PatientDocumentItem[]> {
    const patient = await this.getPatientByUserId(userId);

    const documents = await prisma.medicalDocument.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => {
      const isDoctorGenerated = doc.uploadedBy !== userId;
      return {
        id: doc.id,
        title: doc.documentName,
        documentType: doc.documentType,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        createdAt: doc.createdAt,
        isDoctorGenerated,
        downloadUrl: `/api/patient/documents/${doc.id}/download`,
        viewUrl: `/api/patient/documents/${doc.id}/view`,
      };
    });
  }

  /**
   * Enregistre un nouveau document de sante televerse par le collaborateur.
   */
  async uploadMyDocument(
    userId: string,
    input: PatientUploadDocumentInput,
    file?: Express.Multer.File
  ): Promise<PatientDocumentItem> {
    if (!file) {
      throw new BadRequestError('Veuillez sélectionner un fichier à téléverser (PDF, JPG, PNG)');
    }

    const patient = await this.getPatientByUserId(userId);

    // Repertoire specifique au patient
    const patientDir = path.join(this.uploadsBaseDir, 'patients', patient.id);
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
    }

    // Nom de fichier unique sur disque
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `doc_${timestamp}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const destinationPath = path.join(patientDir, safeFilename);

    // Deplacement du fichier temporaire vers le repertoire final
    fs.renameSync(file.path, destinationPath);

    const relativeStoragePath = path.join('patients', patient.id, safeFilename);

    const savedDoc = await prisma.medicalDocument.create({
      data: {
        patientId: patient.id,
        documentName: file.originalname,
        documentType: input.documentType,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        storagePath: relativeStoragePath,
        uploadedBy: userId,
      },
    });

    return {
      id: savedDoc.id,
      title: savedDoc.documentName,
      documentType: savedDoc.documentType,
      mimeType: savedDoc.mimeType,
      fileSizeBytes: savedDoc.fileSizeBytes,
      createdAt: savedDoc.createdAt,
      isDoctorGenerated: false,
      downloadUrl: `/api/patient/documents/${savedDoc.id}/download`,
      viewUrl: `/api/patient/documents/${savedDoc.id}/view`,
    };
  }

  /**
   * Recupere les informations et le chemin physique d'un document pour telechargement / visualisation.
   * Securise avec verification de propriete (anti-BOLA).
   */
  async getDocumentFile(
    userId: string,
    documentId: string
  ): Promise<{
    document: PatientDocumentItem;
    absolutePath: string;
  }> {
    const patient = await this.getPatientByUserId(userId);

    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.patientId !== patient.id) {
      throw new NotFoundError('Document introuvable dans votre espace personnel');
    }

    const absolutePath = path.resolve(this.uploadsBaseDir, doc.storagePath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError('Le fichier physique associé est introuvable sur le serveur');
    }

    const isDoctorGenerated = doc.uploadedBy !== userId;

    return {
      document: {
        id: doc.id,
        title: doc.documentName,
        documentType: doc.documentType,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        createdAt: doc.createdAt,
        isDoctorGenerated,
        downloadUrl: `/api/patient/documents/${doc.id}/download`,
        viewUrl: `/api/patient/documents/${doc.id}/view`,
      },
      absolutePath,
    };
  }
}

export const patientService = new PatientService();
