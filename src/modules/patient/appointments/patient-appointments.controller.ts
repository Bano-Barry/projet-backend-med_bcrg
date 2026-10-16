/**
 * @file patient-appointments.controller.ts
 * @description Contrôleur Express pour la prise de rendez-vous de l'espace Patient.
 */

import { Request, Response, NextFunction } from 'express';
import { patientAppointmentsService } from './patient-appointments.service';

export class PatientAppointmentsController {
  /**
   * GET /api/patient/appointments/available-days?month=2026-10
   */
  async getAvailableDays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month as string;
      const data = await patientAppointmentsService.getAvailableDays(month);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/patient/appointments/available-slots?date=2026-10-16
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string;
      const data = await patientAppointmentsService.getAvailableSlots(date);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/patient/appointments
   */
  async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const appointment = await patientAppointmentsService.bookAppointment(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Votre rendez-vous a été programmé avec succès. Il apparaîtra sur l\'agenda du médecin.',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/patient/appointments/my
   */
  async getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const appointments = await patientAppointmentsService.getMyAppointments(userId);
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/patient/appointments/:id/cancel
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const appointmentId = req.params.id as string;
      const reason = req.body?.reason;
      const result = await patientAppointmentsService.cancelAppointment(userId, appointmentId, reason);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const patientAppointmentsController = new PatientAppointmentsController();
