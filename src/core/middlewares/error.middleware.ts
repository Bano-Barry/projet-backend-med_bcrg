/**
 * @file error.middleware.ts
 * @description Middleware Express centralise de traitement des erreurs.
 * Formate les reponses d'erreur selon une structure JSON standardisee et
 * evite la divulgation d'informations sensibles (stack traces) en environnement de production.
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors';
import { env } from '../../config/env';

/**
 * Gestionnaire d'erreurs global de l'application Express.
 *
 * @param err L'erreur levee par un middleware ou controleur
 * @param _req La requete Express
 * @param res La reponse Express
 * @param _next La fonction suivante dans la chaine Express
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  // Journalisation de l'erreur inattendue
  console.error('Erreur inattendue :', err);

  // Reponse 500 generique pour les erreurs non capturees
  res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue sur le serveur.',
    ...(env.NODE_ENV === 'development' ? { error: err.message, stack: err.stack } : {}),
  });
};
