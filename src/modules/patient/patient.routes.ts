/**
 * @file patient.routes.ts
 * @description Déclaration des routes du module Espace Collaborateur / Patient (/api/patient).
 * Accessible à tout collaborateur authentifié (EMPLOYEE, DOCTOR, HR) pour ses propres données.
 */

import { Router } from 'express';
import { patientController } from './patient.controller';
import {
  authenticate,
  requirePasswordChanged,
} from '../../core/middlewares/auth.middleware';
import { documentUpload } from '../../core/middlewares/upload.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { uploadPatientDocumentSchema } from './patient.schemas';

const router = Router();

// Toutes les routes de l'espace patient nécessitent d'être connecté et mot de passe changé
router.use(authenticate, requirePasswordChanged);

/**
 * @route GET /api/patient/vitals
 * @desc Historique complet des constantes vitales du collaborateur
 */
router.get('/vitals', (req, res, next) => patientController.getMyVitals(req, res, next));

/**
 * @route GET /api/patient/documents
 * @desc Liste de tous les documents du patient (ordonnances du médecin + documents importés)
 */
router.get('/documents', (req, res, next) => patientController.getMyDocuments(req, res, next));

/**
 * @route POST /api/patient/documents/upload
 * @desc Téléversement d'un document médical (analyses, comptes rendus, imagerie...)
 */
router.post(
  '/documents/upload',
  documentUpload.single('file'),
  validateRequest(uploadPatientDocumentSchema),
  (req, res, next) => patientController.uploadDocument(req, res, next)
);

/**
 * @route GET /api/patient/documents/:id/view
 * @desc Visualisation d'un document en ligne (PDF/Image)
 */
router.get('/documents/:id/view', (req, res, next) => patientController.viewDocument(req, res, next));

/**
 * @route GET /api/patient/documents/:id/download
 * @desc Téléchargement sécurisé d'un document
 */
router.get('/documents/:id/download', (req, res, next) => patientController.downloadDocument(req, res, next));

export const patientRoutes = router;
