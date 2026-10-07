/**
 * @file consultations.routes.ts
 * @description Routes de gestion des consultations cliniques pour le medecin.
 */

import { Router } from 'express';
import { doctorConsultationsController } from './consultations.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { doctorDocumentsController } from '../documents/doctor-documents.controller';
import {
  createConsultationSchema,
  updateConsultationSchema,
  addPrescriptionSchema,
  deletePrescriptionSchema,
  listConsultationsQuerySchema,
} from './consultations.schemas';

const router = Router();

/**
 * Statistiques en temps reel pour les cartes KPI du medecin.
 */
router.get('/stats', doctorConsultationsController.getStats.bind(doctorConsultationsController));

/**
 * Liste paginee et filtree des consultations.
 */
router.get(
  '/',
  validateRequest(listConsultationsQuerySchema),
  doctorConsultationsController.listConsultations.bind(doctorConsultationsController)
);

/**
 * Detail complet d'une consultation (avec constantes, ordonnances et dossier).
 */
router.get(
  '/:id',
  doctorConsultationsController.getConsultationById.bind(doctorConsultationsController)
);

/**
 * Demarrer une nouvelle consultation (avec constantes optionnelles).
 */
router.post(
  '/',
  validateRequest(createConsultationSchema),
  doctorConsultationsController.createConsultation.bind(doctorConsultationsController)
);

/**
 * Mettre a jour ou cloturer une consultation existante.
 */
router.patch(
  '/:id',
  validateRequest(updateConsultationSchema),
  doctorConsultationsController.updateConsultation.bind(doctorConsultationsController)
);


/**
 * Ajouter une ligne de prescription (ordonnance).
 */
router.post(
  '/:id/prescriptions',
  validateRequest(addPrescriptionSchema),
  doctorConsultationsController.addPrescription.bind(doctorConsultationsController)
);

/**
 * Retirer une ligne de prescription.
 */
router.delete(
  '/:id/prescriptions/:prescriptionId',
  validateRequest(deletePrescriptionSchema),
  doctorConsultationsController.deletePrescription.bind(doctorConsultationsController)
);

/**
 * Generer automatiquement l'ordonnance officielle (document PDF) et l'enregistrer en GED.
 */
router.post(
  '/:id/prescription/generate',
  doctorDocumentsController.generatePrescription.bind(doctorDocumentsController)
);

export const doctorConsultationsRoutes = router;

