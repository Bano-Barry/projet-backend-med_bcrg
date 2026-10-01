/**
 * @file doctor.routes.ts
 * @description Point d'entree unifie de l'espace Medecin (/api/doctor).
 * Protege l'ensemble des sous-modules par authentification et controle de role (DOCTOR).
 */

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  authenticate,
  requireRoles,
  requirePasswordChanged,
} from '../../core/middlewares/auth.middleware';
import { doctorConsultationsRoutes } from './consultations/consultations.routes';
import { patientsDoctorRoutes } from './patients/patients-doctor.routes';

const router = Router();

// 1. Authentification obligatoire pour tout le perimetre medecin
router.use(authenticate);

// 2. Renouvellement prealable du mot de passe temporaire requis
router.use(requirePasswordChanged);

// 3. Controle strict RBAC : reserve exclusivement au profil DOCTOR
router.use(requireRoles(UserRole.DOCTOR));

// 4. Enregistrement des sous-modules
router.use('/consultations', doctorConsultationsRoutes);
router.use('/patients', patientsDoctorRoutes);

export const doctorRoutes = router;
