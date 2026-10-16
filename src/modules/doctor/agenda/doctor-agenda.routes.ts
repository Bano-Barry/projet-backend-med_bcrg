/**
 * @file doctor-agenda.routes.ts
 * @description Déclaration des routes pour l'agenda et la gestion des rendez-vous par le médecin.
 */

import { Router } from 'express';
import { doctorAgendaController } from './doctor-agenda.controller';
import { validateRequest } from '../../../core/middlewares/validate.middleware';
import {
  agendaQuerySchema,
  dayAgendaParamSchema,
  approveAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelDoctorAppointmentSchema,
} from './doctor-agenda.schemas';

const router = Router();

/**
 * @route GET /api/doctor/agenda
 * @desc Consultation des rendez-vous sur une plage temporelle (vue semaine ou mois)
 */
router.get(
  '/',
  validateRequest(agendaQuerySchema),
  (req, res, next) => doctorAgendaController.getAgenda(req, res, next)
);

/**
 * @route GET /api/doctor/agenda/day/:date
 * @desc Consultation détaillée des rendez-vous d'un jour spécifique (volet latéral droit)
 */
router.get(
  '/day/:date',
  validateRequest(dayAgendaParamSchema),
  (req, res, next) => doctorAgendaController.getDayDetails(req, res, next)
);

/**
 * @route PATCH /api/doctor/agenda/appointments/:id/approve
 * @desc Approuver une demande de rendez-vous (PROGRAMME -> CONFIRME)
 */
router.patch(
  '/appointments/:id/approve',
  validateRequest(approveAppointmentSchema),
  (req, res, next) => doctorAgendaController.approveAppointment(req, res, next)
);

/**
 * @route PATCH /api/doctor/agenda/appointments/:id/reschedule
 * @desc Reprogrammer un rendez-vous sur une nouvelle date et créneau
 */
router.patch(
  '/appointments/:id/reschedule',
  validateRequest(rescheduleAppointmentSchema),
  (req, res, next) => doctorAgendaController.rescheduleAppointment(req, res, next)
);

/**
 * @route PATCH /api/doctor/agenda/appointments/:id/cancel
 * @desc Refuser ou annuler un rendez-vous avec motif
 */
router.patch(
  '/appointments/:id/cancel',
  validateRequest(cancelDoctorAppointmentSchema),
  (req, res, next) => doctorAgendaController.cancelAppointment(req, res, next)
);

export const doctorAgendaRoutes = router;
