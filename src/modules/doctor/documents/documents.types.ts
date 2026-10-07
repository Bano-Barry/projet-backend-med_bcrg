/**
 * @file documents.types.ts
 * @description Types et interfaces pour la gestion documentaire et l'edition d'ordonnances.
 */

export interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency?: string | null;
  duration: string;
  instructions?: string | null;
}

export interface PrescriptionPdfData {
  reference: string;
  consultationDate: Date;
  doctor: {
    firstName: string;
    lastName: string;
    matricule?: string;
    jobTitle?: string | null;
  };
  patient: {
    firstName: string;
    lastName: string;
    matricule: string;
    department?: string | null;
    jobTitle?: string | null;
    gender?: string | null;
    bloodGroup?: string | null;
  };
  prescriptions: PrescriptionItem[];
  advice?: string | null;
  diagnosis?: string | null;
}

export interface MedicalDocumentResponse {
  id: string;
  patientId: string;
  consultationId?: string | null;
  documentName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: string;
  version: number;
  createdAt: Date;
  downloadUrl: string;
  viewUrl: string;
}
