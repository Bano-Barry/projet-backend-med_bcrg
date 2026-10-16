/**
 * @file server.ts
 * @description Point d'entree principal du serveur backend.
 * Initialise le serveur HTTP, ecoute sur le port configure et definit
 * les gestionnaires d'arret gracieux (graceful shutdown) pour liberer les ressources.
 */

import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './infrastructure/database/prisma';
import { autoCompletePastAppointments } from './modules/patient/appointments/patient-appointments.service';

const app = createApp();

/**
 * Demarrage de l'ecoute des requetes sur le port configure.
 */
const server = app.listen(env.PORT, () => {
  console.log(`Serveur Backend Infirmerie BCRG demarre avec succes.`);
  console.log(`Ecoute sur : http://localhost:${env.PORT}`);
  // console.log(`Health check : http://localhost:${env.PORT}/api/health`);
  console.log(`Environnement : ${env.NODE_ENV}`);
});

/**
 * Tâche d'arrière-plan récurrente : bascule à COMPLETED les rendez-vous dont l'horaire
 * est dépassé de plus de 15 minutes (exécutée toutes les 5 minutes).
 */
const appointmentAutoCloseInterval = setInterval(async () => {
  try {
    const updatedCount = await autoCompletePastAppointments();
    if (updatedCount > 0) {
      console.log(`[Rendez-vous] ${updatedCount} rendez-vous passé(s) de plus de 15 min basculé(s) au statut COMPLETED.`);
    }
  } catch (error) {
    console.error('[Rendez-vous] Erreur lors de l\'auto-complétion des rendez-vous passés :', error);
  }
}, 5 * 60 * 1000);
appointmentAutoCloseInterval.unref();

/**
 * Effectue l'arret gracieux du serveur HTTP et ferme les connexions a la base de donnees.
 *
 * @param signal Signal d'arret recu par le processus (ex: SIGINT, SIGTERM)
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\nSignal ${signal} recu. Fermeture gracieuse en cours...`);
  clearInterval(appointmentAutoCloseInterval);

  server.close(async () => {
    console.log('Serveur HTTP ferme.');
    await prisma.$disconnect();
    console.log('Connexion a la base de donnees liberee.');
    process.exit(0);
  });

  // Forcer l'arret si le processus ne se termine pas dans le delai imparti
  setTimeout(() => {
    console.error('Fermeture forcee apres delai de temporisation.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
