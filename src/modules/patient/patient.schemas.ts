/**
 * @file patient.schemas.ts
 * @description Schemas de validation Zod pour le module Espace Collaborateur / Patient.
 */

import { z } from 'zod';

/**
 * Types de documents acceptes lors du televersement par le collaborateur.
 */
export const ALLOWED_PATIENT_DOC_TYPES = [
  'LAB_RESULT',       // Résultats d'analyses (Laboratoire)
  'SPECIALIST_REPORT', // Compte rendu spécialiste
  'IMAGING',           // Imagerie (Radiographie, Échographie...)
  'MEDICAL_CERTIFICATE', // Certificat médical extérieur
  'OTHER',             // Autre document de santé
] as const;

export const uploadPatientDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum(ALLOWED_PATIENT_DOC_TYPES, {
      errorMap: () => ({
        message: 'Type de document invalide (LAB_RESULT, SPECIALIST_REPORT, IMAGING, MEDICAL_CERTIFICATE, OTHER)',
      }),
    }),
  }),
});
