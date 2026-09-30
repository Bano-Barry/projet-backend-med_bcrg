/**
 * @file auth.routes.ts
 * @description Declaration des routes de l'API pour le module d'authentification.
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { authRateLimiter } from '../../core/middlewares/rate-limiter.middleware';
import {
  loginSchema,
  changeInitialPasswordSchema,
  refreshTokenSchema,
} from './auth.schemas';

const router = Router();

/**
 * Route publique de connexion par matricule et mot de passe.
 * Protegee par limitation de debit pour empecher les attaques par force brute.
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login.bind(authController)
);

/**
 * Route protegee de modification obligatoire du premier mot de passe.
 * Accessible uniquement apres connexion initiale valide (is_first_login = true).
 */
router.post(
  '/change-initial-password',
  authenticate,
  validateRequest(changeInitialPasswordSchema),
  authController.changeInitialPassword.bind(authController)
);

/**
 * Route de renouvellement de la session a l'aide du refresh token.
 */
router.post(
  '/refresh-token',
  validateRequest(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

/**
 * Route protegee recuperant les informations de profil de l'utilisateur connecte.
 */
router.get(
  '/me',
  authenticate,
  authController.getMe.bind(authController)
);

/**
 * Route de deconnexion et reinitialisation des cookies de session.
 */
router.post(
  '/logout',
  authController.logout.bind(authController)
);

export const authRoutes = router;
