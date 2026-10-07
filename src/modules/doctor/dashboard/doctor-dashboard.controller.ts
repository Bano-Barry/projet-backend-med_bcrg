/**
 * @file doctor-dashboard.controller.ts
 * @description Controleur REST pour l'endpoint du tableau de bord medecin (/api/doctor/dashboard).
 */

import { Request, Response, NextFunction } from 'express';
import { doctorDashboardService } from './doctor-dashboard.service';

export class DoctorDashboardController {
  /**
   * Recupere la vue d'ensemble complete du tableau de bord medecin.
   *
   * @route GET /api/doctor/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = (req as any).user?.id;
      const dashboardData = await doctorDashboardService.getDashboardData(doctorId);

      res.status(200).json({
        success: true,
        message: 'Données du tableau de bord médecin récupérées avec succès.',
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const doctorDashboardController = new DoctorDashboardController();
