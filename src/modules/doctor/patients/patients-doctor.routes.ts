/**
 * @file patients-doctor.routes.ts
 * @description Routes specialisees pour l'acces medical aux patients par le medecin.
 */

import { Router } from 'express';
import { patientsDoctorController } from './patients-doctor.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { searchPatientsQuerySchema } from '../consultations/consultations.schemas';

const router = Router();

import { doctorDocumentsController } from '../documents/doctor-documents.controller';

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

/**
 * Liste des documents medicaux d'un patient (ordonnances, justificatifs...).
 * Alimente l'onglet "Documents" du dossier patient.
 */
router.get(
  '/:id/documents',
  doctorDocumentsController.getPatientDocuments.bind(doctorDocumentsController)
);

export const patientsDoctorRoutes = router;

