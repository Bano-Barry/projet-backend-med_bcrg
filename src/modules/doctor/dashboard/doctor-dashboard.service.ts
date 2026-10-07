/**
 * @file doctor-dashboard.service.ts
 * @description Service metier fournissant l'ensemble des agregats et indicateurs
 * necessaires au tableau de bord medecin (Dashboard).
 */

import { ConsultationStatus, ConsultationType } from '@prisma/client';
import { prisma } from '../../../infrastructure/database/prisma';
import {
  DoctorDashboardData,
  WeeklyActivityItem,
  RecentConsultationItem,
  QuickActionItem,
  DoctorAlertItem,
} from './dashboard.types';

export class DoctorDashboardService {
  /**
   * Formate une date au format court francais (ex: "07 oct. 2026").
   */
  private formatShortDate(date: Date): string {
    const months = [
      'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Recupere les donnees completes du tableau de bord medecin.
   *
   * @param doctorId Identifiant optionnel du medecin connecte pour personnalisation
   * @returns Objet structure complet pour l'ensemble des composants du dashboard
   */
  async getDashboardData(_doctorId?: string): Promise<DoctorDashboardData> {
    const now = new Date();

    // 1. Bornes temporelles du jour
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 2. Calcul du Lundi de la semaine courante
    // getDay() : 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
    const dayOfWeekIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = LUN, 6 = DIM
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeekIndex);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // 3. Requetes paralleles pour les indicateurs (KPIs) et consultations recentes
    const [
      consultationsToday,
      activeConsultations,
      departmentsList,
      patientsExaminedList,
      totalUsersCount,
      recentConsultationsRaw,
      weekConsultationsRaw,
    ] = await Promise.all([
      // Consultations du jour
      prisma.consultation.count({
        where: {
          consultationDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Consultations actives (en attente ou en cours)
      prisma.consultation.count({
        where: {
          status: {
            in: [ConsultationStatus.WAITING, ConsultationStatus.IN_PROGRESS],
          },
        },
      }),

      // Departements distincts dans l'organisation
      prisma.user.findMany({
        where: {
          department: {
            not: null,
          },
        },
        select: {
          department: true,
        },
        distinct: ['department'],
      }),

      // Personnel examine (patients ayant au moins une consultation)
      prisma.consultation.findMany({
        select: {
          patientId: true,
        },
        distinct: ['patientId'],
      }),

      // Nombre total d'utilisateurs actifs
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),

      // 5 dernieres consultations avec donnees patient
      prisma.consultation.findMany({
        take: 5,
        orderBy: {
          consultationDate: 'desc',
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  matricule: true,
                },
              },
            },
          },
        },
      }),

      // Consultations de toute la semaine pour le graphique
      prisma.consultation.findMany({
        where: {
          consultationDate: {
            gte: monday,
            lte: sunday,
          },
        },
        select: {
          consultationDate: true,
        },
      }),
    ]);

    // 4. Construction de l'activite hebdomadaire (LUN -> DIM)
    const dayLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    const weeklyActivity: WeeklyActivityItem[] = dayLabels.map((dayLabel, index) => {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + index);

      const yyyy = currentDay.getFullYear();
      const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDay.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Compter les consultations tombees ce jour-la
      const count = weekConsultationsRaw.filter((c) => {
        const cDate = new Date(c.consultationDate);
        return (
          cDate.getFullYear() === currentDay.getFullYear() &&
          cDate.getMonth() === currentDay.getMonth() &&
          cDate.getDate() === currentDay.getDate()
        );
      }).length;

      return {
        day: dayLabel,
        date: dateString,
        count,
      };
    });

    // 5. Formatage des consultations recentes
    const recentConsultations: RecentConsultationItem[] = recentConsultationsRaw.map((c) => {
      let typeLabel = 'GENERAL';
      if (c.type === ConsultationType.INSTANT) {
        typeLabel = 'URGENCE';
      } else if (c.type === ConsultationType.PERIODIC) {
        typeLabel = 'PERIODIQUE';
      }

      let statusLabel = 'TERMINEE';
      if (c.status === ConsultationStatus.IN_PROGRESS) {
        statusLabel = 'EN COURS';
      } else if (c.status === ConsultationStatus.WAITING) {
        statusLabel = 'EN ATTENTE';
      } else if (c.status === ConsultationStatus.CANCELLED) {
        statusLabel = 'ANNULEE';
      }

      return {
        id: c.id,
        patientName: `${c.patient.user.firstName} ${c.patient.user.lastName}`,
        patientMatricule: c.patient.registrationNumber || c.patient.user.matricule,
        consultationDate: c.consultationDate.toISOString(),
        formattedDate: this.formatShortDate(c.consultationDate),
        type: c.type,
        typeLabel,
        status: c.status,
        statusLabel,
      };
    });

    // 6. Alertes & Taches prioritaires du medecin
    const alertItems: DoctorAlertItem[] = [
      {
        id: 'alert-stock-01',
        type: 'STOCK_ALERT',
        severity: 'CRITICAL',
        title: 'Rupture de stock : Paracétamol',
        description: 'Le stock est en dessous du seuil critique (5 boîtes restantes).',
        actionLabel: 'Commander',
        actionUrl: '/pharmacie',
      },
      {
        id: 'alert-visit-02',
        type: 'MEDICAL_VISIT',
        severity: 'WARNING',
        title: 'Visites médicales obligatoires',
        description: '3 agents doivent passer leur visite d\'aptitude cette semaine.',
        actionLabel: 'Planifier',
        actionUrl: '/agenda',
      },
      {
        id: 'alert-approval-03',
        type: 'RECORD_APPROVAL',
        severity: 'INFO',
        title: 'Approbation de dossiers',
        description: '2 nouveaux dossiers patients attendent votre validation finale.',
        actionLabel: 'Vérifier',
        actionUrl: '/dossiers-medicaux',
      },
    ];

    // 7. Raccourcis d'acces rapide
    const quickActions: QuickActionItem[] = [
      {
        key: 'new_patient',
        label: 'Nouveau Patient',
        subtitle: 'Ajouter un dossier médical',
        route: '/dossiers-medicaux/nouveau',
      },
      {
        key: 'new_consultation',
        label: 'Nouvelle Consultation',
        subtitle: 'Démarrer un examen',
        route: '/consultations/nouvelle',
      },
      {
        key: 'dispense_medication',
        label: 'Délivrer Médicament',
        subtitle: 'Gestion de la pharmacie',
        route: '/pharmacie',
      },
    ];

    return {
      kpis: {
        consultationsToday,
        activeConsultations,
        departmentsCount: Math.max(departmentsList.length, 1),
        patientsExaminedCount: patientsExaminedList.length,
        usersCount: totalUsersCount,
      },
      weeklyActivity,
      alerts: {
        pendingCount: 0,
        items: alertItems,
      },
      recentConsultations,
      quickActions,
    };
  }
}

export const doctorDashboardService = new DoctorDashboardService();
