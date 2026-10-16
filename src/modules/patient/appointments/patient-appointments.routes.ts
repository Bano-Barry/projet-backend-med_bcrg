/**
 * @file patient-appointments.routes.ts
 * @description Déclaration des routes de prise de rendez-vous pour l'espace Patient.
 */

import { Router } from 'express';
import { patientAppointmentsController } from './patient-appointments.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import {
  availableDaysQuerySchema,
  availableSlotsQuerySchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
} from './patient-appointments.schemas';

const router = Router();

/**
 * @route GET /api/patient/appointments/available-days
 * @desc Consultation des jours disponibles et de leur remplissage pour un mois donné
 */
router.get(
  '/available-days',
  validateRequest(availableDaysQuerySchema),
  (req, res, next) => patientAppointmentsController.getAvailableDays(req, res, next)
);

/**
 * @route GET /api/patient/appointments/available-slots
 * @desc Consultation des créneaux horaires disponibles pour une date donnée
 */
router.get(
  '/available-slots',
  validateRequest(availableSlotsQuerySchema),
  (req, res, next) => patientAppointmentsController.getAvailableSlots(req, res, next)
);

/**
 * @route POST /api/patient/appointments
 * @desc Réserver un nouveau rendez-vous médical
 */
router.post(
  '/',
  validateRequest(bookAppointmentSchema),
  (req, res, next) => patientAppointmentsController.bookAppointment(req, res, next)
);

/**
 * @route GET /api/patient/appointments/my
 * @desc Liste de mes rendez-vous (à venir et passés)
 */
router.get(
  '/my',
  (req, res, next) => patientAppointmentsController.getMyAppointments(req, res, next)
);

/**
 * @route PATCH /api/patient/appointments/:id/cancel
 * @desc Annuler un rendez-vous
 */
router.patch(
  '/:id/cancel',
  validateRequest(cancelAppointmentSchema),
  (req, res, next) => patientAppointmentsController.cancelAppointment(req, res, next)
);

export const patientAppointmentsRoutes = router;
