/**
 * @file app.ts
 * @description Usine d'instanciation et de configuration de l'application Express.
 * Configure la pile de middlewares (securite Helmet, CORS, cookies, parsing JSON, journalisation Morgan)
 * et enregistre les points d'entree de l'API.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './core/middlewares/error.middleware';
import { NotFoundError } from './core/errors';

/**
 * Cree et configure une nouvelle instance de l'application Express.
 *
 * @returns Instance configuree d'Express Application
 */
export const createApp = (): Application => {
  const app = express();

  // En-tetes de securite HTTP
  app.use(helmet());

  // Gestion du partage de ressources entre origines multiples (CORS)
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Journalisation des requetes HTTP
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  // Analyse des corps de requetes JSON et URL-encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Analyse des cookies de session
  app.use(cookieParser());

  // Point de controle de disponibilite (Health Check)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'backend-med-bcrg',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Interception des routes non referencees (404)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route introuvable : ${req.method} ${req.originalUrl}`));
  });

  // Gestionnaire d'erreurs centralise
  app.use(errorHandler);

  return app;
};
