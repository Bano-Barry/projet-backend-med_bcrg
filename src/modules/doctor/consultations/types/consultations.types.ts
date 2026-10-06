/**
 * @file consultations.types.ts
 * @description Interfaces et types metier pour le module Consultations Cliniques (DOCTOR).
 */

import { ConsultationStatus, ConsultationType } from '@prisma/client';

export interface VitalSignsInput {
  bloodPressure?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperatureC?: number;
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
  respiratoryRate?: number;
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
