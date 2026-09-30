/**
 * @file express.d.ts
 * @description Extension des declarations de types globales pour le module Express.
 * Permet d'attacher l'utilisateur authentifie a la requete HTTP.
 */

import { AuthenticatedUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      /** Utilisateur authentifie present lorsque la requete traverse le middleware authenticate */
      user?: AuthenticatedUser;
    }
  }
}
