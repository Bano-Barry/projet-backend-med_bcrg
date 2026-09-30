/**
 * @file seed.ts
 * @description Script d'ensemencement initial de la base de donnees (Seed).
 * Cree les comptes initiaux requis pour le demarrage du projet (Administrateur, Medecin, DRH).
 */

import { prisma } from './prisma';
import { hashPassword } from '../../core/utils/security';
import { UserRole } from '@prisma/client';

/**
 * Fonction principale d'ensemencement.
 */
async function main() {
  console.log('Debut de l\'ensemencement des donnees initiales...');

  // Mot de passe temporaire initial par defaut
  const initialPasswordHash = await hashPassword('ChangeMe@2026!');

  // 1. Creation du compte Administrateur RH systeme
  const adminUser = await prisma.user.upsert({
    where: { matricule: '2007' },
    update: {
      role: UserRole.HR,
    },
    create: {
      matricule: '2007',
      email: 'mamadoub.barry@bcrg.guinee.org',
      passwordHash: initialPasswordHash,
      firstName: 'Mamadou BANO',
      lastName: 'BARRY',
      role: UserRole.HR,
      phone: '+224620000001',
      isFirstLogin: true,
      isActive: true,
    },
  });

  console.log(`Compte administrateur RH cree : ${adminUser.matricule} (Role: ${adminUser.role})`);

  // 2. Creation d'un compte Medecin initial
  const doctorUser = await prisma.user.upsert({
    where: { matricule: '2008' },
    update: {},
    create: {
      matricule: '2008',
      email: 'dabo@bcrg-guinee.org',
      passwordHash: initialPasswordHash,
      firstName: 'Dr. MamaDdou',
      lastName: 'Dabo',
      role: UserRole.DOCTOR,
      phone: '+224620000002',
      isFirstLogin: true,
      isActive: true,
    },
  });

  console.log(`Compte medecin cree : ${doctorUser.matricule} (Role: ${doctorUser.role})`);

  // 3. Creation d'un compte Responsable RH initial
  const hrUser = await prisma.user.upsert({
    where: { matricule: '2009' },
    update: {},
    create: {
      matricule: '2009',
      email: 'mohameds.soumah@bcrg-guinee.org',
      passwordHash: initialPasswordHash,
      firstName: 'Mohamed Senia',
      lastName: 'Soumah',
      role: UserRole.HR,
      phone: '+224620000003',
      isFirstLogin: true,
      isActive: true,
    },
  });

  console.log(`Compte RH cree : ${hrUser.matricule} (Role: ${hrUser.role})`);

  console.log('Ensemencement termine avec succes.');
  console.log('Mot de passe temporaire pour tous les comptes initiaux : ChangeMe@2026!');
}

main()
  .catch((e) => {
    console.error('Erreur lors de l\'ensemencement :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
