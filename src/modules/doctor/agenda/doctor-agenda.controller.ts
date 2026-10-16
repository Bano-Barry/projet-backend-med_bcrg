/**
 * @file doctor-agenda.controller.ts
 * @description Contrôleur Express pour l'agenda et la gestion des rendez-vous par le médecin.
 */

import { Request, Response, NextFunction } from 'express';
import { doctorAgendaService } from './doctor-agenda.service';

export class DoctorAgendaController {
  /**
   * GET /api/doctor/agenda?startDate=2026-10-12&endDate=2026-10-16
   */
  async getAgenda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const appointments = await doctorAgendaService.getAgenda(startDate, endDate);
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctor/agenda/day/:date
   */
  async getDayDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.params.date as string;
      const dayData = await doctorAgendaService.getDayDetails(date);
      res.status(200).json({
        success: true,
        data: dayData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/doctor/appointments/:id/approve
   */
  async approveAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const doctorUserId = req.user!.id;
      const appointment = await doctorAgendaService.approveAppointment(
        appointmentId,
        doctorUserId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Rendez-vous approuvé avec succès.',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/doctor/appointments/:id/reschedule
   */
  async rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const doctorUserId = req.user!.id;
      const appointment = await doctorAgendaService.rescheduleAppointment(
        appointmentId,
        doctorUserId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Rendez-vous reprogrammé avec succès.',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/doctor/appointments/:id/cancel
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.id as string;
      const doctorUserId = req.user!.id;
      const reason = req.body.reason;
      const appointment = await doctorAgendaService.cancelAppointment(
        appointmentId,
        doctorUserId,
        reason
      );
      res.status(200).json({
        success: true,
        message: 'Rendez-vous annulé avec succès.',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const doctorAgendaController = new DoctorAgendaController();
