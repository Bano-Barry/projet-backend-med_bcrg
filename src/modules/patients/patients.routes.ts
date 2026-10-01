/**
 * @file patients.routes.ts
 * @description Declaration des routes de l'API pour le module Employes & Profils Medicaux.
 */

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { patientsController } from './patients.controller';
import {
  authenticate,
  requireRoles,
  requirePasswordChanged,
} from '../../core/middlewares/auth.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientByIdSchema,
  listPatientsQuerySchema,
  addPatientAllergySchema,
  deletePatientAllergySchema,
} from './patients.schemas';

const router = Router();

// Toutes les routes relatives aux employes requierent d'etre authentifie
router.use(authenticate);

/**
 * Route permettant a un collaborateur de consulter sa propre fiche employe.
 */
router.get(
  '/me',
  patientsController.getMyPatientProfile.bind(patientsController)
);

// Pour les operations cliniques suivantes, le mot de passe initial doit avoir ete change
router.use(requirePasswordChanged);

/**
 * Enrolement d'un collaborateur employe.
 * Reserve exclusivement aux administrateurs RH.
 */
router.post(
  '/',
  requireRoles(UserRole.HR, UserRole.DOCTOR),
  validateRequest(createPatientSchema),
  patientsController.createPatient.bind(patientsController)
);

/**
 * Recherche et pagination des employes.
 * Reserve exclusivement aux administrateurs RH.
 */
router.get(
  '/',
  requireRoles(UserRole.HR, UserRole.DOCTOR),
  validateRequest(listPatientsQuerySchema),
  patientsController.listPatients.bind(patientsController)
);

/**
 * Consultation detaillee d'une fiche employe par identifiant.
 * Accessible aux administrateurs RH, soignants ou a l'employe concerne (protection BOLA/IDOR).
 */
router.get(
  '/:id',
  validateRequest(getPatientByIdSchema),
  patientsController.getPatientById.bind(patientsController)
);

/**
 * Mise a jour des donnees de l'employe.
 * Reserve exclusivement aux administrateurs RH.
 */
router.put(
  '/:id',
  requireRoles(UserRole.HR),
  validateRequest(updatePatientSchema),
  patientsController.updatePatient.bind(patientsController)
);

/**
 * Ajout d'une allergie a la fiche de l'employe.
 * Reserve au personnel medical habilite (DOCTOR).
 */
router.post(
  '/:id/allergies',
  requireRoles(UserRole.DOCTOR),
  validateRequest(addPatientAllergySchema),
  patientsController.addAllergy.bind(patientsController)
);

/**
 * Retrait d'une allergie de la fiche de l'employe.
 * Reserve au personnel medical habilite (DOCTOR).
 */
router.delete(
  '/:id/allergies/:allergyId',
  requireRoles(UserRole.DOCTOR),
  validateRequest(deletePatientAllergySchema),
  patientsController.deleteAllergy.bind(patientsController)
);

export const patientsRoutes = router;
