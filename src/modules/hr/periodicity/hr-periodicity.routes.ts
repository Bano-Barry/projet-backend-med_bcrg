/**
 * @file hr-periodicity.routes.ts
 * @description Déclaration des routes pour la périodicité des visites obligatoires et relances RH.
 */

import { Router } from 'express';
import { hrPeriodicityController } from './hr-periodicity.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import { updateVisitPeriodicitySchema } from './hr-periodicity.schemas';

const router = Router();

/**
 * @route GET /api/hr/periodicity/settings
 * @desc Consultation des paramètres actuels de périodicité des visites
 */
router.get(
  '/settings',
  (req, res, next) => hrPeriodicityController.getSettings(req, res, next)
);

/**
 * @route PUT /api/hr/periodicity/settings
 * @desc Mise à jour des paramètres de périodicité (Standard, SMR, délai d'alerte)
 */
router.put(
  '/settings',
  validateRequest(updateVisitPeriodicitySchema),
  (req, res, next) => hrPeriodicityController.updateSettings(req, res, next)
);

/**
 * @route GET /api/hr/periodicity/due-employees
 * @desc Liste des collaborateurs avec calcul d'échéance et de relance médicale
 */
router.get(
  '/due-employees',
  (req, res, next) => hrPeriodicityController.getDueEmployees(req, res, next)
);

export const hrPeriodicityRoutes = router;
