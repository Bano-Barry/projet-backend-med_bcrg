/**
 * @file hr.types.ts
 * @description Interfaces et contrats de donnees pour le module Profil RH & Reporting.
 * Conformite V4 : acces uniquement a des agregats sans donnee medicale individuelle.
 */

export interface HrDashboardData {
  totalEmployees: number;
  activeEmployees: number;
  departmentsCount: number;
  totalConsultationsThisMonth: number;
  totalSickLeaveDaysThisMonth: number;
  employeesOnSickLeaveCurrent: number;
}

export interface HrDepartmentStatisticsItem {
  department: string;
  employeeCount: number;
  consultationCount: number;
  sickLeaveDays: number;
}

export interface HrStatisticsData {
  period: {
    start: string;
    end: string;
  };
  totalConsultations: number;
  totalSickLeaves: number;
  totalSickLeaveDays: number;
  byDepartment: HrDepartmentStatisticsItem[];
}

export interface HrDiabetesStatisticsData {
  diabeticPatients: number;
  glycemiaChecks: number;
  stripConsumption: number;
  remainingStrips: number;
}
