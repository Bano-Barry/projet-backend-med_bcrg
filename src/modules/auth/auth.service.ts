/**
 * @file auth.service.ts
 * @description Logique metier du module d'authentification et de gestion des acces.
 */

import { prisma } from '../../infrastructure/database/prisma';
import {
  comparePassword,
  hashPassword,
  generateTokens,
  verifyRefreshToken,
} from '../../core/utils/security';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '../../core/errors';
import { AuthTokenPayload } from '../../core/types/auth.types';

export class AuthService {
  /**
   * Authentifie un utilisateur a l'aide de son matricule et de son mot de passe.
   *
   * @param matricule Matricule BCRG de l'employe
   * @param password Mot de passe candidat
   * @returns Informations de l'utilisateur, jetons JWT et statut de premier acces
   */
  async login(matricule: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { matricule: matricule.trim() },
      include: {
        patient: {
          select: {
            id: true,
            bloodGroup: true,
          },
        },
      },
    });

    // Message d'erreur generique pour eviter l'enumeration d'utilisateurs
    if (!user) {
      throw new UnauthorizedError('Identifiants de connexion incorrects');
    }

    if (!user.isActive) {
      throw new ForbiddenError(
        'Ce compte est désactivé. Veuillez contacter l\'administrateur.'
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Identifiants de connexion incorrects');
    }

    // Mise a jour de la date de derniere connexion si ce n'est pas le premier acces
    if (!user.isFirstLogin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    const tokenPayload: AuthTokenPayload = {
      sub: user.id,
      matricule: user.matricule,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
    };

    const tokens = generateTokens(tokenPayload);

    return {
      user: {
        id: user.id,
        matricule: user.matricule,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        department: user.department,
        jobTitle: user.jobTitle,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        patient: user.patient,
      },
      tokens,
    };
  }

  /**
   * Modifie le mot de passe initial temporaire d'un utilisateur.
   *
   * @param userId Identifiant unique de l'utilisateur
   * @param currentPassword Mot de passe actuel
   * @param newPassword Nouveau mot de passe
   * @returns Profil utilisateur mis a jour et nouveaux jetons
   */
  async changeInitialPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new BadRequestError('Le mot de passe actuel fourni est incorrect');
    }

    const newPasswordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        isFirstLogin: false,
        lastLoginAt: new Date(),
      },
    });

    const tokenPayload: AuthTokenPayload = {
      sub: updatedUser.id,
      matricule: updatedUser.matricule,
      role: updatedUser.role,
      isFirstLogin: false,
    };

    const tokens = generateTokens(tokenPayload);

    return {
      message: 'Mot de passe mis a jour avec succes.',
      user: {
        id: updatedUser.id,
        matricule: updatedUser.matricule,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isFirstLogin: false,
      },
      tokens,
    };
  }

  /**
   * Renouvelle l'access token a partir d'un refresh token valide.
   *
   * @param refreshToken Jeton de rafraichissement
   * @returns Nouvelle paire de jetons
   */
  async refreshSession(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Session invalide ou compte inactif');
    }

    const tokenPayload: AuthTokenPayload = {
      sub: user.id,
      matricule: user.matricule,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
    };

    return generateTokens(tokenPayload);
  }

  /**
   * Recupere les informations detaillees du profil de l'utilisateur connecte.
   *
   * @param userId Identifiant unique de l'utilisateur
   * @returns Profil utilisateur sans le mot de passe hache
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        matricule: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        department: true,
        jobTitle: true,
        isFirstLogin: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            gender: true,
            bloodGroup: true,
            medicalHistory: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    return user;
  }
}

export const authService = new AuthService();
