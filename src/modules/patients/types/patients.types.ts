/**
 * @file patients.types.ts
 * @description Interfaces et types metier pour la gestion des employes et allergies.
 */

import { AllergyType, AllergySeverity, UserRole } from '@prisma/client';

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

export interface FormattedEmployeeUser {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  role: UserRole;
  isFirstLogin?: boolean;
  isActive?: boolean;
}

export interface FormattedPatientResponse {
  id: string;
  gender: string;
  bloodGroup: string | null;
  medicalHistory: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: FormattedEmployeeUser;
  allergies: any[];
}
