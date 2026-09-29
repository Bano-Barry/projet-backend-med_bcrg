/**
 * @file prisma.ts
 * @description Instance unique (singleton) du client Prisma ORM.
 * Gere la connexion avec la base de donnees PostgreSQL et evite la creation
 * de multiples connexions concurrentes lors du rechargement a chaud en developpement.
 */

import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Instance partagee de PrismaClient pour l'ensemble de l'application.
 */
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
