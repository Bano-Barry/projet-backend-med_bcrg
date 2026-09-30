/**
 * @file rate-limiter.middleware.ts
 * @description Middleware de limitation de debit (rate limiting) pour contrer les attaques par force brute.
 */

import rateLimit from 'express-rate-limit';

/**
 * Limiteur de debit strict pour les routes d'authentification (login, refresh).
 * Autorise un maximum de 10 tentatives par tranche de 15 minutes par adresse IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requetes maximum
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion depuis cette adresse IP. Veuillez reessayer dans 15 minutes.',
  },
});
