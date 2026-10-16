/**
 * @file hr-periodicity.controller.ts
 * @description Contrôleur Express pour la périodicité des visites médicales et relances RH.
 */

import { Request, Response, NextFunction } from 'express';
import { hrPeriodicityService } from './hr-periodicity.service';

export class HrPeriodicityController {
  /**
   * GET /api/hr/periodicity/settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await hrPeriodicityService.getSettings();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/hr/periodicity/settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await hrPeriodicityService.updateSettings(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Configuration de périodicité des visites enregistrée avec succès.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/periodicity/due-employees
   */
  async getDueEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await hrPeriodicityService.getDueEmployees();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const hrPeriodicityController = new HrPeriodicityController();
