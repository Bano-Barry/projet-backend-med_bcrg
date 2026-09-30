/**
 * @file auth.controller.ts
 * @description Controleur HTTP du module d'authentification.
 * Traite les requetes HTTP entrantes, appelle les services correspondants
 * et formate les reponses renvoyees au client.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { BadRequestError } from '../../core/errors';

export class AuthController {
  /**
   * Traite la connexion d'un utilisateur par son matricule.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { matricule, password } = req.body;
      const result = await authService.login(matricule, password);

      // Stockage du refresh token dans un cookie securise httpOnly
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });

      res.status(200).json({
        success: true,
        message: 'Authentification reussie.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Traite la modification obligatoire du mot de passe initial.
   */
  async changeInitialPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changeInitialPassword(userId, currentPassword, newPassword);

      // Renouvellement du cookie de rafraichissement
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renouvelle les jetons de session.
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;

      if (!token) {
        throw new BadRequestError('Jeton de rafraichissement manquant');
      }

      const tokens = await authService.refreshSession(token);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Session renouvelee avec succes.',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere les informations de l'utilisateur actuellement authentifie.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deconnecte l'utilisateur en supprimant le cookie de session.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Deconnexion reussie.',
    });
  }
}

export const authController = new AuthController();
