/**
 * @file patients-doctor.routes.ts
 * @description Routes specialisees pour l'acces medical aux patients par le medecin.
 */

import { Router } from 'express';
import { patientsDoctorController } from './patients-doctor.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { searchPatientsQuerySchema } from '../consultations/consultations.schemas';

const router = Router();

/**
 * Autocompletion de recherche de patient (nom, prenom, matricule).
 */
router.get(
  '/search',
  validateRequest(searchPatientsQuerySchema),
  patientsDoctorController.searchPatients.bind(patientsDoctorController)
);

/**
 * Dossier medical detaille d'un patient pour consultation par le medecin.
 */
router.get(
  '/:id/medical-record',
  patientsDoctorController.getMedicalRecord.bind(patientsDoctorController)
);

export const patientsDoctorRoutes = router;
