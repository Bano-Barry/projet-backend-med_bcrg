/**
 * @file doctor-agenda.schemas.ts
 * @description Schémas de validation Zod pour l'agenda et le pilotage des rendez-vous par le médecin.
 */

import { z } from 'zod';

export const agendaQuerySchema = z.object({
  query: z.object({
    startDate: z
      .string({ required_error: 'Le paramètre startDate (YYYY-MM-DD) est requis' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format startDate invalide (attendu: YYYY-MM-DD)'),
    endDate: z
      .string({ required_error: 'Le paramètre endDate (YYYY-MM-DD) est requis' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format endDate invalide (attendu: YYYY-MM-DD)'),
  }),
});

export const dayAgendaParamSchema = z.object({
  params: z.object({
    date: z
      .string({ required_error: 'La date (YYYY-MM-DD) est requise' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (attendu: YYYY-MM-DD)'),
  }),
});

export const appointmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant de rendez-vous invalide'),
  }),
});

export const approveAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant de rendez-vous invalide'),
  }),
  body: z.object({
    doctorNotes: z
      .string()
      .max(500, 'Les remarques ne peuvent excéder 500 caractères')
      .optional()
      .nullable(),
  }),
});

export const rescheduleAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant de rendez-vous invalide'),
  }),
  body: z.object({
    newDate: z
      .string({ required_error: 'La nouvelle date est obligatoire' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de nouvelle date invalide (YYYY-MM-DD)'),
    newTime: z
      .string({ required_error: 'Le nouvel horaire est obligatoire' })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format d'heure invalide (HH:mm)"),
    reason: z
      .string()
      .max(500, 'Le motif ne peut excéder 500 caractères')
      .optional()
      .nullable(),
  }),
});

export const cancelDoctorAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Identifiant de rendez-vous invalide'),
  }),
  body: z.object({
    reason: z
      .string({ required_error: "Le motif d'annulation est obligatoire" })
      .min(3, "Le motif d'annulation doit comporter au moins 3 caractères")
      .max(500, "Le motif d'annulation ne peut excéder 500 caractères"),
  }),
});
