/**
 * @file security.ts
 * @description Fonctions utilitaires de cryptographie et de gestion des jetons JWT.
 * Assure le hachage des mots de passe (bcrypt) et la manipulation des jetons d'authentification.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthTokenPayload } from '../types/auth.types';
import { UnauthorizedError } from '../errors';

/** Nombre de passes (salt rounds) pour l'algorithme bcrypt */
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hache un mot de passe en texte brut avec un sel aleatoire.
 *
 * @param password Mot de passe en texte brut a hacher
 * @returns Promesse resolue avec le hachage securise
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare un mot de passe en texte brut avec son empreinte hachee.
 *
 * @param password Mot de passe candidat
 * @param hash Empreinte de reference stockee en base
 * @returns Vrai si le mot de passe correspond, faux sinon
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Genere une paire de jetons JWT (access token et refresh token).
 *
 * @param payload Donnees a encoder dans les jetons
 * @returns Objet contenant l'access token et le refresh token
 */
export const generateTokens = (
  payload: AuthTokenPayload
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

/**
 * Verifie et decode un jeton d'acces JWT.
 *
 * @param token Jeton d'acces a verifier
 * @returns Charge utile decodee du jeton
 * @throws UnauthorizedError si le jeton est invalide ou expire
 */
export const verifyAccessToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Jeton d\'acces invalide ou expire');
  }
};

/**
 * Verifie et decode un jeton de rafraichissement JWT.
 *
 * @param token Jeton de rafraichissement a verifier
 * @returns Charge utile decodee du jeton
 * @throws UnauthorizedError si le jeton est invalide ou expire
 */
export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Jeton de rafraichissement invalide ou expire');
  }
};
