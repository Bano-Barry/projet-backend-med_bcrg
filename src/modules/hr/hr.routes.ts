/**
 * @file hr.routes.ts
 * @description Déclaration des routes du module Profil RH & Reporting (/api/hr).
 * Sécurisé par authentification JWT et restriction stricte au rôle HR.
 */

import { Router } from 'express';
import { hrController } from './hr.controller';
import {
  authenticate,
  requireRoles,
  requirePasswordChanged,
} from '../../core/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Toutes les routes RH exigent une authentification active, le rôle HR et le mot de passe initial modifié
router.use(authenticate, requirePasswordChanged, requireRoles(UserRole.HR));

/**
 * @route GET /api/hr/dashboard
 * @desc Tableau de bord synthétique RH
 */
router.get('/dashboard', (req, res, next) => hrController.getDashboard(req, res, next));

/**
 * @route GET /api/hr/statistics
 * @desc Statistiques d'activité médicale agrégées par direction
 */
router.get('/statistics', (req, res, next) => hrController.getStatistics(req, res, next));

/**
 * @route GET /api/hr/statistics/diabetes
 * @desc Suivi consolidé de l'activité diabétique et consommation de bandelettes
 */
router.get('/statistics/diabetes', (req, res, next) =>
  hrController.getDiabetesStatistics(req, res, next)
);

/**
 * @route GET /api/hr/reports/export
 * @desc Téléchargement du rapport de synthèse RH au format PDF
 */
router.get('/reports/export', (req, res, next) => hrController.exportReport(req, res, next));

/**
 * Sous-module : Configuration de la périodicité des visites obligatoires et relances
 * Routes : /api/hr/periodicity
 */
import { hrPeriodicityRoutes } from './periodicity/hr-periodicity.routes';
router.use('/periodicity', hrPeriodicityRoutes);

export const hrRoutes = router;

