/**
 * @file hr-periodicity.schemas.ts
 * @description Schémas de validation Zod pour la configuration de la périodicité des visites.
 */

import { z } from 'zod';

export const updateVisitPeriodicitySchema = z.object({
  body: z.object({
    standardFrequencyMonths: z
      .number({ required_error: 'La fréquence des visites standard est obligatoire' })
      .int('La fréquence standard doit être un entier')
      .min(1, 'La fréquence standard minimale est de 1 mois')
      .max(60, 'La fréquence standard maximale est de 60 mois'),
    smrFrequencyMonths: z
      .number({ required_error: 'La fréquence SMR est obligatoire' })
      .int('La fréquence SMR doit être un entier')
      .min(1, 'La fréquence SMR minimale est de 1 mois')
      .max(60, 'La fréquence SMR maximale est de 60 mois'),
    reminderLeadDays: z
      .number({ required_error: "Le délai d'alerte RH est obligatoire" })
      .int("Le délai d'alerte doit être un entier")
      .min(1, "Le délai d'alerte minimal est de 1 jour")
      .max(180, "Le délai d'alerte maximal est de 180 jours"),
  }),
});
