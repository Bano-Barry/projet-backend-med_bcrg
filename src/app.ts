/**
 * @file app.ts
 * @description Usine d'instanciation et de configuration de l'application Express.
 * Configure la pile de middlewares (securite Helmet, CORS, cookies, parsing JSON, journalisation Morgan)
 * et enregistre les points d'entree de l'API.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './core/middlewares/error.middleware';
import { NotFoundError } from './core/errors';
import { authRoutes } from './modules/auth/auth.routes';
import { setupSwagger } from './docs/swagger';

/**
 * Cree et configure une nouvelle instance de l'application Express.
 *
 * @returns Instance configuree d'Express Application
 */
export const createApp = (): Application => {
  const app = express();

  // En-tetes de securite HTTP
  app.use(
    helmet({
      contentSecurityPolicy: false, // Necessaire pour le rendu des scripts et styles Swagger UI
    })
  );

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

  // Fichiers statiques (documentation autonome, assets)
  app.use('/static', express.static(path.resolve(__dirname, '../public')));

  // Configuration de la documentation interactive Swagger UI
  setupSwagger(app);

  // Point d'accueil et informations generales sur l'API
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'API Infirmerie BCRG',
      version: '1.0.0',
      status: 'UP',
      description: 'Systeme de gestion de l\'infirmerie de la Banque Centrale de la Republique de Guinee',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        docs: '/api/docs',
      },
    });
  });

  // Point de controle de disponibilite (Health Check)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'backend-med-bcrg',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Enregistrement des modules de l'API REST
  app.use('/api/auth', authRoutes);

  // Interception des routes non referencees (404)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route introuvable : ${req.method} ${req.originalUrl}`));
  });

  // Gestionnaire d'erreurs centralise
  app.use(errorHandler);

  return app;
};
