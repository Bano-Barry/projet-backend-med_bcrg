/**
 * @file doctor-documents.controller.ts
 * @description Controleur Express pour les documents medicaux et le telechargement/visualisation d'ordonnances.
 */

import { Request, Response, NextFunction } from 'express';
import { doctorDocumentsService } from './doctor-documents.service';

export class DoctorDocumentsController {
  /**
   * Genere automatiquement l'ordonnance PDF d'une consultation et l'enregistre dans le dossier medical.
   */
  async generatePrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = String(req.params.id);
      const doctorId = (req as any).user.id;

      const document = await doctorDocumentsService.generateConsultationPrescription(
        consultationId,
        doctorId
      );

      res.status(201).json({
        success: true,
        message: 'Ordonnance médicale générée avec succès.',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere l'ensemble des documents d'un patient (ordonnances, justificatifs, etc.).
   */
  async getPatientDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = String(req.params.id);
      const documents = await doctorDocumentsService.getPatientDocuments(patientId);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ouvre et affiche le document PDF dans le navigateur (visionneuse en ligne).
   */
  async viewDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = String(req.params.documentId);
      const { document, absolutePath } = await doctorDocumentsService.getDocumentFile(documentId);

      res.setHeader('Content-Type', document.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.documentName)}.pdf"`);
      res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Telecharge le document PDF sur le terminal client.
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = String(req.params.documentId);
      const { document, absolutePath } = await doctorDocumentsService.getDocumentFile(documentId);

      const downloadFileName = `${document.documentName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;
      res.download(absolutePath, downloadFileName);
    } catch (error) {
      next(error);
    }
  }
}

export const doctorDocumentsController = new DoctorDocumentsController();
