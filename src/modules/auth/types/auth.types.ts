/**
 * @file auth.types.ts
 * @description Types et interfaces specifiques au module Authentification.
 */

import { UserRole } from '@prisma/client';

export interface UserPatientSummary {
  id: string;
  bloodGroup: string | null;
}

export interface UserProfileResponseData {
  id: string;
  matricule: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  role: UserRole;
  isFirstLogin: boolean;
  patient?: UserPatientSummary | null;
}

export interface LoginResult {
  user: UserProfileResponseData;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ChangePasswordResult {
  message: string;
  user: {
    id: string;
    matricule: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: UserRole;
    isFirstLogin: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
