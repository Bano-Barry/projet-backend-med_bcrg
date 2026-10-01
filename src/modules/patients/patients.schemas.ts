/**
 * @file patients.schemas.ts
 * @description Schemas de validation Zod pour la gestion des employes et des allergies.
 */

import { z } from 'zod';
import { AllergySeverity, AllergyType } from '@prisma/client';

/**
 * Schema de creation ou d'enrolement d'un collaborateur employe.
 */
export const createPatientSchema = z.object({
  body: z.object({
    // Informations d'identification du collaborateur
    matricule: z
      .string({ required_error: 'Le matricule est obligatoire' })
      .trim()
      .min(4, 'Le matricule doit comporter au moins 4 caracteres')
      .regex(/^[0-9]+$/, 'Le matricule doit contenir uniquement des chiffres'),
    firstName: z
      .string({ required_error: 'Le prenom est obligatoire' })
      .trim()
      .min(2, 'Le prenom doit comporter au moins 2 caracteres'),
    lastName: z
      .string({ required_error: 'Le nom de famille est obligatoire' })
      .trim()
      .min(2, 'Le nom doit comporter au moins 2 caracteres'),
    email: z
      .string()
      .trim()
      .email('Format d\'adresse email invalide')
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[0-9\s-]{9,20}$/,
        'Le format du numero de telephone est invalide (9 chiffres, indicatif optionnel)'
      )
      .optional()
      .or(z.literal('')),

    // Informations professionnelles et fiche employe
    gender: z
      .enum(['M', 'F'], {
        errorMap: () => ({ message: 'Le genre doit etre M (Masculin) ou F (Feminin)' }),
      }),
    department: z
      .string({ required_error: 'La direction ou service est obligatoire' })
      .trim()
      .min(2, 'La direction doit comporter au moins 2 caracteres'),
    jobTitle: z
      .string({ required_error: 'Le poste occupe est obligatoire' })
      .trim()
      .min(2, 'Le poste doit comporter au moins 2 caracteres'),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional()
      .or(z.literal('')),
    medicalHistory: z
      .string()
      .optional()
      .or(z.literal('')),
  }),
});

/**
 * Schema de mise a jour des informations administratives et de la fiche de l'employe.
 */
export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format d\'identifiant employe invalide (UUID requis)'),
  }),
  body: z.object({
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[0-9\s-]{8,20}$/,
        'Le format du numero de telephone est invalide (entre 8 et 20 chiffres, indicatif optionnel)'
      )
      .optional()
      .or(z.literal('')),
    department: z.string().trim().min(2).optional(),
    jobTitle: z.string().trim().min(2).optional(),
    bloodGroup: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional()
      .or(z.literal('')),
    medicalHistory: z.string().optional().or(z.literal('')),
  }),
});

/**
 * Schema de consultation d'un employe par son identifiant.
 */
export const getPatientByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format d\'identifiant employe invalide (UUID requis)'),
  }),
});

/**
 * Schema de recherche et de pagination pour la liste des employes.
 */
export const listPatientsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    department: z.string().trim().optional(),
    page: z.string().regex(/^[0-9]+$/).transform((v) => parseInt(v, 10)).default('1'),
    limit: z.string().regex(/^[0-9]+$/).transform((v) => parseInt(v, 10)).default('20'),
  }),
});

/**
 * Schema d'ajout d'une allergie a la fiche de l'employe.
 */
export const addPatientAllergySchema = z.object({
  params: z.object({
    id: z.string().uuid('Format d\'identifiant employe invalide (UUID requis)'),
  }),
  body: z.object({
    allergyType: z.nativeEnum(AllergyType, {
      errorMap: () => ({
        message: 'Le type d\'allergie doit etre DRUG, FOOD, OCCUPATIONAL ou OTHER',
      }),
    }),
    substance: z
      .string({ required_error: 'La substance allergene est obligatoire' })
      .trim()
      .min(2, 'La substance doit comporter au moins 2 caracteres'),
    reactionDetails: z.string().optional().or(z.literal('')),
    severity: z
      .nativeEnum(AllergySeverity, {
        errorMap: () => ({
          message: 'La severite doit etre MILD, MODERATE ou SEVERE',
        }),
      })
      .default(AllergySeverity.MODERATE),
  }),
});

/**
 * Schema de suppression d'une allergie de la fiche employe.
 */
export const deletePatientAllergySchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant employe invalide'),
    allergyId: z.string().uuid('Identifiant d\'allergie invalide'),
  }),
});
