/**
 * @file auth.schemas.ts
 * @description Schemas de validation Zod pour le module d'authentification.
 */

import { z } from 'zod';

/**
 * Schema de validation pour la requete de connexion.
 */
export const loginSchema = z.object({
  body: z.object({
    matricule: z
      .string({ required_error: 'Le matricule est obligatoire' })
      .trim()
      .min(4, 'Le matricule doit contenir au moins 4 chiffres')
      .regex(/^[0-9]+$/, 'Le matricule doit contenir uniquement des chiffres'),
    password: z
      .string({ required_error: 'Le mot de passe est obligatoire' })
      .min(8, 'Le mot de passe doit comporter au moins 8 caracteres')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractere special'),
  }),
});

/**
 * Schema de validation pour le changement obligatoire de mot de passe initial.
 */
export const changeInitialPasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ required_error: 'Le mot de passe actuel est obligatoire' })
        .min(1, 'Le mot de passe actuel est requis'),
      newPassword: z
        .string({ required_error: 'Le nouveau mot de passe est obligatoire' })
        .min(8, 'Le nouveau mot de passe doit comporter au moins 8 caracteres')
        .regex(/[A-Z]/, 'Le nouveau mot de passe doit contenir au moins une lettre majuscule')
        .regex(/[a-z]/, 'Le nouveau mot de passe doit contenir au moins une lettre minuscule')
        .regex(/[0-9]/, 'Le nouveau mot de passe doit contenir au moins un chiffre')
        .regex(/[^A-Za-z0-9]/, 'Le nouveau mot de passe doit contenir au moins un caractere special'),
      confirmPassword: z
        .string({ required_error: 'La confirmation du mot de passe est obligatoire' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas',
      path: ['confirmPassword'],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: 'Le nouveau mot de passe doit etre different de l\'ancien',
      path: ['newPassword'],
    }),
});

/**
 * Schema de validation pour le rafraichissement de jeton.
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});
