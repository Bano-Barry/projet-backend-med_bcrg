/**
 * @file doctor-documents.service.ts
 * @description Service de gestion des documents medicaux et de persistance GED des ordonnances.
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../../../infrastructure/database/prisma';
import { NotFoundError, BadRequestError } from '../../../core/errors';
import { prescriptionPdfService } from './prescription-pdf.service';
import { MedicalDocumentResponse } from './documents.types';
import { env } from '../../../config/env';

export class DoctorDocumentsService {
  private uploadsBaseDir: string;

  constructor() {
    this.uploadsBaseDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
  }

  /**
   * Formate une date courte en francais pour le libelle du document (ex: "06 oct. 2026").
   */
  private formatShortDate(date: Date): string {
    const months = [
      'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Genere et enregistre en base/GED l'ordonnance officielle d'une consultation.
   *
   * @param consultationId Identifiant unique de la consultation
   * @param doctorId Identifiant unique du medecin connecté
   * @returns Document medical cree avec liens de consultation et de telechargement
   */
  async generateConsultationPrescription(
    consultationId: string,
    doctorId: string
  ): Promise<MedicalDocumentResponse> {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: true,
        prescriptions: true,
      },
    });

    if (!consultation) {
      throw new NotFoundError('Consultation introuvable');
    }

    if (!consultation.prescriptions || consultation.prescriptions.length === 0) {
      throw new BadRequestError(
        'Cette consultation ne comporte aucune prescription médicamenteuse à éditer.'
      );
    }

    const year = consultation.consultationDate.getFullYear();
    const month = String(consultation.consultationDate.getMonth() + 1).padStart(2, '0');
    const shortId = consultation.id.slice(0, 6).toUpperCase();
    const reference = `ORD-${year}-${month}-${shortId}`;

    // 1. Generation du flux PDF
    const pdfBuffer = await prescriptionPdfService.generatePrescriptionPdf({
      reference,
      consultationDate: consultation.consultationDate,
      doctor: {
        firstName: consultation.doctor.firstName,
        lastName: consultation.doctor.lastName,
        matricule: consultation.doctor.matricule,
        jobTitle: consultation.doctor.jobTitle,
      },
      patient: {
        firstName: consultation.patient.user.firstName,
        lastName: consultation.patient.user.lastName,
        matricule: consultation.patient.user.matricule,
        department: consultation.patient.user.department,
        jobTitle: consultation.patient.user.jobTitle,
        gender: consultation.patient.gender,
        bloodGroup: consultation.patient.bloodGroup,
      },
      prescriptions: consultation.prescriptions,
      advice: consultation.advice,
      diagnosis: consultation.diagnosis,
    });

    // 2. Sauvegarde sur disque dans uploads/prescriptions
    const prescriptionsDir = path.join(this.uploadsBaseDir, 'prescriptions');
    if (!fs.existsSync(prescriptionsDir)) {
      fs.mkdirSync(prescriptionsDir, { recursive: true });
    }

    const fileBaseName = `ordonnance_${consultation.patient.user.matricule}_${consultation.id.slice(0, 8)}.pdf`;
    const fullDiskPath = path.join(prescriptionsDir, fileBaseName);
    const relativeStoragePath = path.join('prescriptions', fileBaseName).replace(/\\/g, '/');

    fs.writeFileSync(fullDiskPath, pdfBuffer);

    // Titre d'affichage exact (ex: "Ordonnance - 06 oct. 2026")
    const formattedDate = this.formatShortDate(consultation.consultationDate);
    const documentTitle = `Ordonnance - ${formattedDate}`;

    // 3. Enregistrement ou mise a jour du document en base de donnees
    const existingDoc = await prisma.medicalDocument.findFirst({
      where: {
        consultationId,
        documentType: 'PRESCRIPTION',
      },
    });

    let savedDoc;
    if (existingDoc) {
      savedDoc = await prisma.medicalDocument.update({
        where: { id: existingDoc.id },
        data: {
          documentName: documentTitle,
          mimeType: 'application/pdf',
          fileSizeBytes: pdfBuffer.length,
          storagePath: relativeStoragePath,
          version: existingDoc.version + 1,
          uploadedBy: doctorId,
        },
      });
    } else {
      savedDoc = await prisma.medicalDocument.create({
        data: {
          patientId: consultation.patientId,
          consultationId,
          documentName: documentTitle,
          mimeType: 'application/pdf',
          fileSizeBytes: pdfBuffer.length,
          storagePath: relativeStoragePath,
          documentType: 'PRESCRIPTION',
          version: 1,
          uploadedBy: doctorId,
        },
      });
    }

    return this.formatDocumentResponse(savedDoc);
  }

  /**
   * Recupere la liste de tous les documents medicaux d'un patient.
   * Alimente directement l'onglet "Documents" du dossier medical patient.
   *
   * @param patientId Identifiant unique du patient
   */
  async getPatientDocuments(patientId: string): Promise<MedicalDocumentResponse[]> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundError('Dossier patient introuvable');
    }

    const documents = await prisma.medicalDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => this.formatDocumentResponse(doc));
  }

  /**
   * Recupere les metadonnees et le chemin absolu sur disque d'un document.
   *
   * @param documentId Identifiant unique du document
   */
  async getDocumentFile(documentId: string): Promise<{
    document: MedicalDocumentResponse;
    absolutePath: string;
  }> {
    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundError('Document introuvable');
    }

    const absolutePath = path.resolve(this.uploadsBaseDir, doc.storagePath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError('Le fichier physique associé est introuvable sur le serveur');
    }

    return {
      document: this.formatDocumentResponse(doc),
      absolutePath,
    };
  }

  /**
   * Formate la reponse d'un document avec les URLs de visualisation et de telechargement.
   */
  private formatDocumentResponse(doc: any): MedicalDocumentResponse {
    return {
      id: doc.id,
      patientId: doc.patientId,
      consultationId: doc.consultationId,
      documentName: doc.documentName,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      documentType: doc.documentType,
      version: doc.version,
      createdAt: doc.createdAt,
      viewUrl: `/api/doctor/documents/${doc.id}/view`,
      downloadUrl: `/api/doctor/documents/${doc.id}/download`,
    };
  }
}

export const doctorDocumentsService = new DoctorDocumentsService();
