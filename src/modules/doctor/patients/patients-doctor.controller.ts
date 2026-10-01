/**
 * @file patients-doctor.controller.ts
 * @description Controleur HTTP pour la consultation clinique des patients par le medecin.
 */

import { Request, Response, NextFunction } from 'express';
import { patientsDoctorService } from './patients-doctor.service';

export class PatientsDoctorController {
  /**
   * Recherche rapide de patients pour le champ autocompletion du modal.
   */
  async searchPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query.q || '');
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

      const patients = await patientsDoctorService.searchPatients(q, limit);

      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere le dossier medical d'un patient pour le medecin (avec historique et allergies).
   */
  async getMedicalRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.id);
      const record = await patientsDoctorService.getMedicalRecord(patientId);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const patientsDoctorController = new PatientsDoctorController();
