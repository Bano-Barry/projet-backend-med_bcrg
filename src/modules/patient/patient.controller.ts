/**
 * @file patient.controller.ts
 * @description Controleur Express exposant les endpoints de l'espace collaborateur/patient.
 */

import { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service';
import { AuthenticatedUser } from '../../core/types/auth.types';

export class PatientController {
  /**
   * GET /api/patient/vitals
   * Historique complet des constantes vitales du collaborateur connecte.
   */
  async getMyVitals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user as AuthenticatedUser;
      const data = await patientService.getMyVitals(currentUser.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/patient/documents
   * Liste de tous les documents du collaborateur (ordonnances + téléversements).
   */
  async getMyDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user as AuthenticatedUser;
      const data = await patientService.getMyDocuments(currentUser.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/patient/documents/upload
   * Téléversement multipart d'un document médical par le collaborateur (PDF, JPG, PNG).
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user as AuthenticatedUser;
      const { documentType } = req.body;
      const file = req.file;

      const data = await patientService.uploadMyDocument(
        currentUser.id,
        { documentType },
        file
      );

      res.status(201).json({
        success: true,
        message: 'Document médical importé avec succès dans votre dossier.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/patient/documents/:id/view
   * Visualisation en ligne d'un document (Content-Disposition: inline).
   */
  async viewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user as AuthenticatedUser;
      const id = req.params.id as string;

      const { document, absolutePath } = await patientService.getDocumentFile(currentUser.id, id);

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.title}"`);
      res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/patient/documents/:id/download
   * Téléchargement d'un document (Content-Disposition: attachment).
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user as AuthenticatedUser;
      const id = req.params.id as string;

      const { document, absolutePath } = await patientService.getDocumentFile(currentUser.id, id);

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}"`);
      res.download(absolutePath, document.title);
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
