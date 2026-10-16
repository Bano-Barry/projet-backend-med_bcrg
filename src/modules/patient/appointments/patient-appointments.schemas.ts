/**
 * @file patient-appointments.schemas.ts
 * @description Schémas de validation Zod pour la prise de rendez-vous patient.
 */

import { z } from 'zod';
import { ConsultationType } from '@prisma/client';

export const availableDaysQuerySchema = z.object({
  query: z.object({
    month: z
      .string({ required_error: 'Le paramètre month (YYYY-MM) est requis' })
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format de mois invalide (attendu : YYYY-MM, ex: 2026-10)'),
  }),
});

export const availableSlotsQuerySchema = z.object({
  query: z.object({
    date: z
      .string({ required_error: 'Le paramètre date (YYYY-MM-DD) est requis' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (attendu : YYYY-MM-DD, ex: 2026-10-16)'),
  }),
});

export const bookAppointmentSchema = z.object({
  body: z.object({
    appointmentDate: z
      .string({ required_error: 'La date du rendez-vous est obligatoire' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    scheduledTime: z
      .string({ required_error: "L'heure du rendez-vous est obligatoire" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format d'heure invalide (HH:mm, ex: 09:00)"),
    type: z.nativeEnum(ConsultationType, {
      errorMap: () => ({ message: 'Type de consultation invalide (GENERAL, INSTANT, PERIODIC)' }),
    }),
    reason: z
      .string()
      .max(500, 'Le motif ne peut excéder 500 caractères')
      .optional()
      .nullable(),
  }),
});

export const cancelAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant de rendez-vous invalide'),
  }),
  body: z.object({
    reason: z
      .string()
      .max(255, "La raison d'annulation ne peut excéder 255 caractères")
      .optional()
      .nullable(),
  }),
});
