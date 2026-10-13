/**
 * @file hr.controller.ts
 * @description Controleur Express exposant les endpoints RH & Reporting (V4).
 */

import { Request, Response, NextFunction } from 'express';
import { hrService } from './hr.service';

export class HrController {
  /**
   * GET /api/hr/dashboard
   * Synthèse générale RH (effectifs, consultations du mois, arrêts de travail).
   */
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await hrService.getDashboardData();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/statistics
   * Statistiques d'activité médicale agrégées par direction / service.
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await hrService.getStatistics(startDate, endDate);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/statistics/diabetes
   * Suivi consolidé de l'activité diabétique et de la consommation des bandelettes.
   */
  async getDiabetesStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await hrService.getDiabetesStatistics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hr/reports/export?format=pdf
   * Téléchargement ou flux du rapport d'activité globale RH au format PDF.
   */
  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pdfBuffer = await hrService.exportReportPdf();

      const filename = `Rapport_RH_Infirmerie_BCRG_${new Date().toISOString().slice(0, 10)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const hrController = new HrController();
