/**
 * @file consultations.schemas.ts
 * @description Schemas de validation Zod pour le module de consultation du medecin.
 */

import { z } from 'zod';
import { ConsultationStatus, ConsultationType } from '@prisma/client';

/**
 * Expression reguliere pour valider le format de tension arterielle (ex: "120/80", "130/85").
 */
const BLOOD_PRESSURE_REGEX = /^(\d{2,3})\/(\d{2,3})$/;

/**
 * Schema de saisie des constantes vitales dans la consultation.
 */
export const vitalSignsInputSchema = z.object({
  bloodPressure: z
    .string()
    .trim()
    .regex(BLOOD_PRESSURE_REGEX, 'Format de tension attendu : "120/80"')
    .optional()
    .or(z.literal('')),
  temperatureC: z.number().min(30).max(45).optional(),
  heightCm: z.number().min(30).max(260).optional(),
  weightKg: z.number().min(1).max(350).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      errorMap: () => ({ message: 'Groupe sanguin invalide (ex: A+, O-, B+...)' }),
    })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema de creation / demarrage d'une consultation par le medecin.
 */
export const createConsultationSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Format identifiant patient invalide (UUID attendu)'),
    type: z
      .nativeEnum(ConsultationType, {
        errorMap: () => ({
          message: 'Type de consultation invalide (GENERAL, INSTANT, PERIODIC)',
        }),
      })
      .default(ConsultationType.GENERAL),
    reason: z
      .string({ required_error: 'Le motif de consultation ou les symptomes sont obligatoires' })
      .trim()
      .min(2, 'Le motif doit comporter au moins 2 caracteres'),
    symptoms: z.string().trim().optional(),
    physicalExamination: z.string().trim().optional().or(z.literal('')),
    diagnosis: z.string().trim().optional().or(z.literal('')),
    advice: z.string().trim().optional().or(z.literal('')),
    vitals: vitalSignsInputSchema.optional(),
  }),
});

/**
 * Schema de mise a jour ou cloture d'une consultation.
 */
export const updateConsultationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant consultation invalide'),
  }),
  body: z.object({
    status: z
      .nativeEnum(ConsultationStatus, {
        errorMap: () => ({
          message: 'Statut de consultation invalide (WAITING, IN_PROGRESS, COMPLETED, CANCELLED)',
        }),
      })
      .optional(),
    type: z.nativeEnum(ConsultationType).optional(),
    reason: z.string().trim().min(2).optional(),
    symptoms: z.string().trim().optional(),
    physicalExamination: z.string().trim().optional().or(z.literal('')),
    diagnosis: z.string().trim().optional().or(z.literal('')),
    advice: z.string().trim().optional().or(z.literal('')),
    vitals: vitalSignsInputSchema.optional(),
  }),
});

/**
 * Schema pour ajouter une ligne de prescription (ordonnance).
 */
export const addPrescriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant consultation invalide'),
  }),
  body: z.object({
    medicationName: z
      .string({ required_error: 'Le nom du medicament est obligatoire' })
      .trim()
      .min(2, 'Le nom du medicament doit comporter au moins 2 caracteres')
      .max(150),
    dosage: z
      .string({ required_error: 'La posologie est obligatoire' })
      .trim()
      .min(1, 'La posologie est obligatoire')
      .max(100),
    frequency: z.string().trim().max(100).optional().or(z.literal('')),
    duration: z
      .string({ required_error: 'La duree du traitement est obligatoire' })
      .trim()
      .min(1, 'La duree est obligatoire')
      .max(50),
    instructions: z.string().trim().optional().or(z.literal('')),
  }),
});

/**
 * Schema de suppression d'une prescription.
 */
export const deletePrescriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant consultation invalide'),
    prescriptionId: z.string().uuid('Identifiant prescription invalide'),
  }),
});

/**
 * Schema de recherche et filtrage de la liste des consultations.
 */
export const listConsultationsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    type: z.nativeEnum(ConsultationType).optional(),
    status: z.nativeEnum(ConsultationStatus).optional(),
    date: z.string().trim().optional(),
    page: z.string().regex(/^[0-9]+$/).transform((v) => parseInt(v, 10)).default('1'),
    limit: z.string().regex(/^[0-9]+$/).transform((v) => parseInt(v, 10)).default('10'),
  }),
});

/**
 * Schema de recherche autocompletion de patient par le medecin.
 */
export const searchPatientsQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, 'Au moins un caractere requis pour la recherche'),
    limit: z.string().regex(/^[0-9]+$/).transform((v) => parseInt(v, 10)).default('10'),
  }),
});
