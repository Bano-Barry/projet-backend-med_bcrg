/**
 * @file hr-periodicity.service.ts
 * @description Service de gestion de la périodicité des visites médicales obligatoires et suivi des relances RH.
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { ConsultationType, ConsultationStatus } from '@prisma/client';
import {
  VisitPeriodicitySettingsResponse,
  UpdateVisitPeriodicityInput,
  DueEmployeesSummaryResponse,
  DueEmployeeItem,
  PeriodicVisitStatus,
} from './hr-periodicity.types';

// Postes et mots-clés identifiant un collaborateur sous Suivi Médical Renforcé (SMR)
const SMR_KEYWORDS = [
  'chauffeur',
  'conducteur',
  'securite',
  'sécurité',
  'garde',
  'vigile',
  'convoyeur',
  'fonds',
  'caisse',
  'caissier',
  'manipulateur',
];

const FRENCH_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export class HrPeriodicityService {
  /**
   * Formate une date en français compact (ex: "15 oct. 2026").
   */
  private formatCompactDate(date: Date): string {
    const day = date.getDate();
    const month = FRENCH_MONTHS[date.getMonth()].substring(0, 4);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Récupère la configuration actuelle des périodicités (ou crée celle par défaut).
   */
  async getSettings(): Promise<VisitPeriodicitySettingsResponse> {
    let setting = await prisma.visitPeriodicitySetting.findFirst();

    if (!setting) {
      setting = await prisma.visitPeriodicitySetting.create({
        data: {
          standardFrequencyMonths: 12,
          smrFrequencyMonths: 6,
          reminderLeadDays: 30,
        },
      });
    }

    return {
      id: setting.id,
      standardFrequencyMonths: setting.standardFrequencyMonths,
      standardFrequencyLabel: `Tous les ${setting.standardFrequencyMonths} mois`,
      smrFrequencyMonths: setting.smrFrequencyMonths,
      smrFrequencyLabel: `Tous les ${setting.smrFrequencyMonths} mois`,
      reminderLeadDays: setting.reminderLeadDays,
      reminderLeadLabel: `${setting.reminderLeadDays} jours avant`,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Met à jour la configuration des périodicités par le gestionnaire RH.
   */
  async updateSettings(
    userId: string,
    input: UpdateVisitPeriodicityInput
  ): Promise<VisitPeriodicitySettingsResponse> {
    let setting = await prisma.visitPeriodicitySetting.findFirst();

    if (setting) {
      setting = await prisma.visitPeriodicitySetting.update({
        where: { id: setting.id },
        data: {
          standardFrequencyMonths: input.standardFrequencyMonths,
          smrFrequencyMonths: input.smrFrequencyMonths,
          reminderLeadDays: input.reminderLeadDays,
          updatedBy: userId,
        },
      });
    } else {
      setting = await prisma.visitPeriodicitySetting.create({
        data: {
          standardFrequencyMonths: input.standardFrequencyMonths,
          smrFrequencyMonths: input.smrFrequencyMonths,
          reminderLeadDays: input.reminderLeadDays,
          updatedBy: userId,
        },
      });
    }

    return {
      id: setting.id,
      standardFrequencyMonths: setting.standardFrequencyMonths,
      standardFrequencyLabel: `Tous les ${setting.standardFrequencyMonths} mois`,
      smrFrequencyMonths: setting.smrFrequencyMonths,
      smrFrequencyLabel: `Tous les ${setting.smrFrequencyMonths} mois`,
      reminderLeadDays: setting.reminderLeadDays,
      reminderLeadLabel: `${setting.reminderLeadDays} jours avant`,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Analyse et calcule la conformité des visites médicales obligatoires pour l'ensemble des employés.
   */
  async getDueEmployees(): Promise<DueEmployeesSummaryResponse> {
    const settings = await this.getSettings();

    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            department: true,
            jobTitle: true,
          },
        },
        consultations: {
          where: {
            type: ConsultationType.PERIODIC,
            status: ConsultationStatus.COMPLETED,
          },
          orderBy: { consultationDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const employees: DueEmployeeItem[] = [];

    let upToDateCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;
    let smrCount = 0;

    for (const p of patients) {
      const user = p.user;
      const job = (user.jobTitle || '').toLowerCase();
      const dept = (user.department || '').toLowerCase();

      // Détection Suivi Médical Renforcé (SMR)
      const isSmr = SMR_KEYWORDS.some((kw) => job.includes(kw) || dept.includes(kw));
      if (isSmr) smrCount++;

      const smrReason = isSmr
        ? 'Poste à risque particulier (chauffeur, sécurité ou manipulation de fonds)'
        : null;

      const frequencyMonths = isSmr
        ? settings.smrFrequencyMonths
        : settings.standardFrequencyMonths;

      // Dernière visite médicale périodique enregistrée
      const lastConsultation = p.consultations[0];
      const lastVisitDate = lastConsultation ? lastConsultation.consultationDate : null;

      // Date de référence pour le calcul de l'échéance : date de dernière visite ou date d'enrôlement
      const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(p.createdAt);
      const nextDueDate = new Date(referenceDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + frequencyMonths);

      // Calcul des jours restants
      const diffMs = nextDueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: PeriodicVisitStatus = 'UP_TO_DATE';
      let statusLabel = 'À jour';

      if (daysRemaining < 0) {
        status = 'OVERDUE';
        statusLabel = `En retard de ${Math.abs(daysRemaining)} jour(s)`;
        overdueCount++;
      } else if (daysRemaining <= settings.reminderLeadDays) {
        status = 'DUE_SOON';
        statusLabel = `À relancer (${daysRemaining} jour(s) restant(s))`;
        dueSoonCount++;
      } else {
        upToDateCount++;
      }

      employees.push({
        patientId: p.id,
        matricule: user.matricule,
        fullName: `${user.firstName} ${user.lastName}`,
        department: user.department,
        jobTitle: user.jobTitle,
        isSmr,
        smrReason,
        frequencyMonths,
        lastVisitDate,
        lastVisitFormatted: lastVisitDate ? this.formatCompactDate(lastVisitDate) : 'Aucune visite',
        nextDueDate,
        nextDueDateFormatted: this.formatCompactDate(nextDueDate),
        daysRemaining,
        status,
        statusLabel,
      });
    }

    const totalEmployees = patients.length;
    const coverageRatePercent = totalEmployees > 0
      ? Math.round((upToDateCount / totalEmployees) * 100)
      : 100;

    return {
      totalEmployees,
      upToDateCount,
      dueSoonCount,
      overdueCount,
      smrCount,
      coverageRatePercent,
      employees,
    };
  }
}

export const hrPeriodicityService = new HrPeriodicityService();
