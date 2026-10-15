/**
 * @file patient.types.ts
 * @description Interfaces et types pour le module Espace Collaborateur / Patient (/api/patient).
 */

export interface PatientVitalSignItem {
  id: string;
  consultationId: string;
  measuredAt: Date;
  bloodPressure?: string | null;
  temperatureC?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  bmiLabel?: string | null;
  bloodGroup?: string | null;
}

export interface PatientVitalsSummary {
  bloodPressure?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  temperatureC?: number | null;
  bmi?: number | null;
  bmiLabel?: string | null;
  bloodGroup?: string | null;
  lastVisitDate?: Date | null;
}

export interface PatientDocumentItem {
  id: string;
  title: string;
  documentType: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: Date;
  isDoctorGenerated: boolean;
  downloadUrl: string;
  viewUrl: string;
}

export interface PatientUploadDocumentInput {
  documentType: string;
}
