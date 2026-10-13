/**
 * @file hr.service.ts
 * @description Logique metier du module Profil RH & Reporting.
 * Garantit l'absence totale de donnees de sante individuelles (anonymisation complete).
 */

import { prisma } from '../../infrastructure/database/prisma';
import {
  HrDashboardData,
  HrDepartmentStatisticsItem,
  HrDiabetesStatisticsData,
  HrStatisticsData,
} from './hr.types';
import { hrReportPdfService } from './hr-report-pdf.service';

export class HrService {
  /**
   * Recupere les agregats du Dashboard RH.
   */
  async getDashboardData(): Promise<HrDashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      departmentsList,
      totalConsultationsThisMonth,
      sickLeavesThisMonth,
      activeSickLeaves,
    ] = await Promise.all([
      // Total employés inscrits
      prisma.patient.count(),

      // Collaborateurs avec compte actif
      prisma.user.count({
        where: { isActive: true },
      }),

      // Directions distinctes
      prisma.user.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ['department'],
      }),

      // Consultations médicales réalisées ce mois
      prisma.consultation.count({
        where: {
          consultationDate: { gte: startOfMonth },
        },
      }),

      // Arrêts de travail accordés ce mois
      prisma.sickLeave.findMany({
        where: {
          startDate: { gte: startOfMonth },
        },
        select: { daysCount: true },
      }),

      // Collaborateurs actuellement en arrêt (date du jour comprise entre startDate et endDate)
      prisma.sickLeave.count({
        where: {
          startDate: { lte: startOfDay },
          endDate: { gte: startOfDay },
        },
      }),
    ]);

    const totalSickLeaveDaysThisMonth = sickLeavesThisMonth.reduce(
      (sum, item) => sum + item.daysCount,
      0
    );

    return {
      totalEmployees,
      activeEmployees,
      departmentsCount: Math.max(departmentsList.length, 1),
      totalConsultationsThisMonth,
      totalSickLeaveDaysThisMonth,
      employeesOnSickLeaveCurrent: activeSickLeaves,
    };
  }

  /**
   * Recupere les statistiques d'activite groupees par direction/service (anonymisees).
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<HrStatisticsData> {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const [allUsers, consultations, sickLeaves] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          department: true,
          patient: { select: { id: true } },
        },
      }),
      prisma.consultation.findMany({
        where: {
          consultationDate: { gte: start, lte: end },
        },
        select: {
          id: true,
          patient: {
            select: {
              user: { select: { department: true } },
            },
          },
        },
      }),
      prisma.sickLeave.findMany({
        where: {
          startDate: { gte: start, lte: end },
        },
        select: {
          id: true,
          daysCount: true,
          patient: {
            select: {
              user: { select: { department: true } },
            },
          },
        },
      }),
    ]);

    // Regroupement par direction
    const deptMap = new Map<string, { employeeCount: number; consultationCount: number; sickLeaveDays: number }>();

    allUsers.forEach((u) => {
      const d = u.department || 'Direction non affectée';
      if (!deptMap.has(d)) {
        deptMap.set(d, { employeeCount: 0, consultationCount: 0, sickLeaveDays: 0 });
      }
      deptMap.get(d)!.employeeCount += 1;
    });

    consultations.forEach((c) => {
      const d = c.patient.user.department || 'Direction non affectée';
      if (!deptMap.has(d)) {
        deptMap.set(d, { employeeCount: 0, consultationCount: 0, sickLeaveDays: 0 });
      }
      deptMap.get(d)!.consultationCount += 1;
    });

    sickLeaves.forEach((s) => {
      const d = s.patient.user.department || 'Direction non affectée';
      if (!deptMap.has(d)) {
        deptMap.set(d, { employeeCount: 0, consultationCount: 0, sickLeaveDays: 0 });
      }
      deptMap.get(d)!.sickLeaveDays += s.daysCount;
    });

    const byDepartment: HrDepartmentStatisticsItem[] = Array.from(deptMap.entries()).map(
      ([department, stats]) => ({
        department,
        employeeCount: stats.employeeCount,
        consultationCount: stats.consultationCount,
        sickLeaveDays: stats.sickLeaveDays,
      })
    );

    const totalSickLeaveDays = sickLeaves.reduce((sum, item) => sum + item.daysCount, 0);

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalConsultations: consultations.length,
      totalSickLeaves: sickLeaves.length,
      totalSickLeaveDays,
      byDepartment,
    };
  }

  /**
   * Recupere les indicateurs consolides sur le diabete et les bandelettes.
   * Format conforme V4 : { diabeticPatients, glycemiaChecks, stripConsumption, remainingStrips }
   */
  async getDiabetesStatistics(): Promise<HrDiabetesStatisticsData> {
    const [totalGlycemiaChecks, glucoseStockRecord, diabeticConsultations] = await Promise.all([
      // Total contrôles glycémiques réalisés
      prisma.glycemiaCheck.count({
        where: { performed: true },
      }),
      // Stock paramétré
      prisma.medicalSupplyStock.findUnique({
        where: { itemKey: 'GLUCOSE_STRIPS' },
      }),
      // Consultations diabétiques pour compter les patients uniques
      prisma.consultation.findMany({
        where: {
          OR: [
            { reason: { contains: 'diab', mode: 'insensitive' } },
            { diagnosis: { contains: 'diab', mode: 'insensitive' } },
            { glycemiaCheck: { performed: true } },
          ],
        },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    const initialStock = glucoseStockRecord?.initialStock ?? 100;
    const stripConsumption = totalGlycemiaChecks;
    const remainingStrips = Math.max(0, initialStock - stripConsumption);

    return {
      diabeticPatients: diabeticConsultations.length,
      glycemiaChecks: totalGlycemiaChecks,
      stripConsumption,
      remainingStrips,
    };
  }

  /**
   * Genere le rapport officiel d'activite RH au format PDF.
   */
  async exportReportPdf(): Promise<Buffer> {
    const [dashboard, statistics, diabetes] = await Promise.all([
      this.getDashboardData(),
      this.getStatistics(),
      this.getDiabetesStatistics(),
    ]);

    return hrReportPdfService.buildReportPdf({
      generatedAt: new Date(),
      dashboard,
      statistics,
      diabetes,
    });
  }
}

export const hrService = new HrService();
