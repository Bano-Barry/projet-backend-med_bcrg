/**
 * @file patients.controller.ts
 * @description Controleur HTTP pour le module de gestion des dossiers patients et des allergies.
 */

import { Request, Response, NextFunction } from 'express';
import { patientsService } from './patients.service';

export class PatientsController {
  /**
   * Enrole un nouveau collaborateur patient (creation du dossier et du compte).
   */
  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await patientsService.createPatient(req.body);

      res.status(201).json({
        success: true,
        message: 'Collaborateur enrôlé avec succès.',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste les patients avec pagination et filtres de recherche.
   */
  async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, department, page, limit } = req.query as any;

      const result = await patientsService.listPatients({
        search,
        department,
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
   * Recupere la fiche patient detaillee de l'utilisateur connecte.
   */
  async getMyPatientProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const patient = await patientsService.getMyPatientProfile(userId);

      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere la fiche patient detaillee par son identifiant.
   */
  async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.id);
      const patient = await patientsService.getPatientById(patientId, req.user!);

      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met a jour les informations administratives ou antecedents d'un patient.
   */
  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.id);
      const updated = await patientsService.updatePatient(patientId, req.body);

      res.status(200).json({
        success: true,
        message: 'Dossier patient mis à jour avec succès.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ajoute une allergie au dossier d'un patient.
   */
  async addAllergy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.id);
      const allergy = await patientsService.addAllergy(patientId, req.body);

      res.status(201).json({
        success: true,
        message: 'Allergie enregistrée au dossier medical.',
        data: allergy,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire une allergie du dossier patient.
   */
  async deleteAllergy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.id);
      const allergyId = String(req.params.allergyId);
      const result = await patientsService.deleteAllergy(patientId, allergyId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const patientsController = new PatientsController();
