/**
 * @file consultations.types.ts
 * @description Interfaces et types metier pour le module Consultations Cliniques (DOCTOR).
 */

import { ConsultationStatus, ConsultationType } from '@prisma/client';

export interface VitalSignsInput {
  bloodPressure?: string;
  temperatureC?: number;
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
}

export interface GlycemiaInput {
  performed: boolean;
  value?: number;
  unit?: string;
}

export interface CreateConsultationInput {
  patientId: string;
  type?: ConsultationType;
  reason: string;
  symptoms?: string;
  physicalExamination?: string;
  diagnosis?: string;
  advice?: string;
  vitals?: VitalSignsInput;
  glycemia?: GlycemiaInput;
}

export interface CompleteConsultationInput {
  diagnosis?: string;
  physicalExamination?: string;
  advice?: string;
  vitals?: VitalSignsInput;
  glycemia?: GlycemiaInput;
}

export interface UpdateConsultationInput {
  status?: ConsultationStatus;
  type?: ConsultationType;
  reason?: string;
  symptoms?: string;
  physicalExamination?: string;
  diagnosis?: string;
  advice?: string;
  vitals?: VitalSignsInput;
  glycemia?: GlycemiaInput;
}

export interface AddPrescriptionInput {
  medicationName: string;
  dosage: string;
  frequency?: string;
  duration: string;
  instructions?: string;
}

export interface ConsultationListQueryParams {
  search?: string;
  type?: ConsultationType;
  status?: ConsultationStatus;
  date?: string;
  page?: number;
  limit?: number;
}
