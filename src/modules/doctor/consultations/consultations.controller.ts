/**
 * @file consultations.controller.ts
 * @description Controleur HTTP pour le module de consultation clinique du medecin.
 */

import { Request, Response, NextFunction } from 'express';
import { doctorConsultationsService } from './consultations.service';

export class DoctorConsultationsController {
  /**
   * Recupere les compteurs statistiques pour les cartes KPI du dashboard medecin.
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.id;
      const stats = await doctorConsultationsService.getConsultationStats(doctorId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste les consultations avec pagination et filtres.
   */
  async listConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, type, status, date, page, limit } = req.query as any;

      const result = await doctorConsultationsService.listConsultations({
        search,
        type,
        status,
        date,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere le detail d'une consultation (avec dossier patient et ordonnances).
   */
  async getConsultationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const consultation = await doctorConsultationsService.getConsultationById(id);

      res.status(200).json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Demarre une nouvelle consultation avec prise de constantes eventuelle.
   */
  async createConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user!.id;
      const consultation = await doctorConsultationsService.createConsultation(
        doctorId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Consultation démarrée avec succès.',
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met a jour ou cloture une consultation existante.
   */
  async updateConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await doctorConsultationsService.updateConsultation(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Consultation mise à jour avec succès.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ajoute une prescription d'ordonnance a la consultation en cours.
   */
  async addPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultationId = String(req.params.id);
      const prescription = await doctorConsultationsService.addPrescription(
        consultationId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Prescription ajoutée à l\'ordonnance.',
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire une prescription de l'ordonnance.
   */
  async deletePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultationId = String(req.params.id);
      const prescriptionId = String(req.params.prescriptionId);
      const result = await doctorConsultationsService.deletePrescription(
        consultationId,
        prescriptionId
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const doctorConsultationsController = new DoctorConsultationsController();
