/**
 * @file auth.types.ts
 * @description Definitions de types TypeScript associees a l'authentification et aux autorisations.
 */

import { UserRole } from '@prisma/client';

/**
 * Contenu decodable depuis le jeton JWT d'authentification.
 */
export interface AuthTokenPayload {
  /** Identifiant unique de l'utilisateur (UUID) */
  sub: string;

  /** Matricule unique de l'employe */
  matricule: string;

  /** Role assigne a l'utilisateur */
  role: UserRole;

  /** Indique si l'utilisateur doit changer son mot de passe initial */
  isFirstLogin: boolean;
}

/**
 * Utilisateur injecte dans la requete Express apres verification du jeton JWT.
 */
export interface AuthenticatedUser {
  /** Identifiant unique de l'utilisateur (UUID) */
  id: string;

  /** Matricule de l'employe */
  matricule: string;

  /** Role assigne */
  role: UserRole;

  /** Statut de premier acces */
  isFirstLogin: boolean;
}
