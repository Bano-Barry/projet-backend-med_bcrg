/**
 * @file auth.middleware.ts
 * @description Middlewares d'authentification et d'autorisation par roles (RBAC).
 * Controle la presence et la validite des jetons JWT et restreint l'acces aux ressources.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../utils/security';
import { UnauthorizedError, ForbiddenError } from '../errors';

/**
 * Middleware d'authentification verifiant la presence et la validite du jeton JWT.
 * Injecte les informations de l'utilisateur connecte dans req.user.
 *
 * @param req Requete HTTP Express
 * @param _res Reponse HTTP Express
 * @param next Fonction de rappel vers le middleware suivant
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new UnauthorizedError('Authentification requise : jeton absent'));
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      matricule: payload.matricule,
      role: payload.role,
      isFirstLogin: payload.isFirstLogin,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware d'autorisation restreignant l'acces aux utilisateurs possedant au moins un des roles specifies.
 *
 * @param allowedRoles Liste des roles autorises a acceder a la ressource
 * @returns Middleware Express de controle d'acces
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Utilisateur non authentifie'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Acces refuse : le role ${req.user.role} ne possede pas les droits necessaires`
        )
      );
    }

    next();
  };
};

/**
 * Middleware verifiant que l'utilisateur a bien effectue son changement de mot de passe initial.
 * Si isFirstLogin est actif, l'acces aux routes metier est bloque.
 *
 * @param req Requete HTTP Express
 * @param _res Reponse HTTP Express
 * @param next Fonction de rappel vers le middleware suivant
 */
export const requirePasswordChanged = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user && req.user.isFirstLogin) {
    return next(
      new ForbiddenError(
        'Veuillez modifier votre mot de passe initial avant d\'acceder a l\'application'
      )
    );
  }

  next();
};
