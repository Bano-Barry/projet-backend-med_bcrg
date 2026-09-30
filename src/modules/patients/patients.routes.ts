/**
 * @file patients.routes.ts
 * @description Declaration des routes de l'API pour le module Dossier Patient & Allergies.
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

// Toutes les routes relatives aux patients requierent d'etre authentifie
router.use(authenticate);

/**
 * Route permettant a un collaborateur de consulter sa propre fiche patient.
 */
router.get(
  '/me',
  patientsController.getMyPatientProfile.bind(patientsController)
);

// Pour les operations cliniques suivantes, le mot de passe initial doit avoir ete change
router.use(requirePasswordChanged);

/**
 * Enrolement d'un collaborateur patient.
 * Reserve aux profils RH (administrateurs) et soignants.
 */
router.post(
  '/',
  requireRoles(UserRole.HR, UserRole.DOCTOR),
  validateRequest(createPatientSchema),
  patientsController.createPatient.bind(patientsController)
);

/**
 * Recherche et pagination des dossiers patients.
 * Reserve aux soignants et au profil RH.
 */
router.get(
  '/',
  requireRoles(UserRole.HR, UserRole.DOCTOR),
  validateRequest(listPatientsQuerySchema),
  patientsController.listPatients.bind(patientsController)
);

/**
 * Consultation detaillee d'un dossier patient par identifiant.
 * Accessible aux soignants, RH ou a l'employe concerne (protection BOLA/IDOR).
 */
router.get(
  '/:id',
  validateRequest(getPatientByIdSchema),
  patientsController.getPatientById.bind(patientsController)
);

/**
 * Mise a jour des donnees administratives ou des antecedents medicaux du patient.
 * Reserve aux soignants et au profil RH.
 */
router.put(
  '/:id',
  requireRoles(UserRole.HR, UserRole.DOCTOR),
  validateRequest(updatePatientSchema),
  patientsController.updatePatient.bind(patientsController)
);

/**
 * Ajout d'une allergie au dossier patient.
 * Reserve au personnel medical habilité (Medecin, Infirmier).
 */
router.post(
  '/:id/allergies',
  requireRoles(UserRole.DOCTOR),
  validateRequest(addPatientAllergySchema),
  patientsController.addAllergy.bind(patientsController)
);

/**
 * Retrait d'une allergie du dossier patient.
 * Reserve au personnel medical habilité.
 */
router.delete(
  '/:id/allergies/:allergyId',
  requireRoles(UserRole.DOCTOR),
  validateRequest(deletePatientAllergySchema),
  patientsController.deleteAllergy.bind(patientsController)
);

export const patientsRoutes = router;
