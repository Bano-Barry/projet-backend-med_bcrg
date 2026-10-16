/**
 * @file hr-periodicity.types.ts
 * @description Interfaces et types pour la gestion de la périodicité des visites médicales (Espace RH / Admin).
 */

export interface VisitPeriodicitySettingsResponse {
  id: string;
  standardFrequencyMonths: number; // ex: 12
  standardFrequencyLabel: string; // "Tous les 12 mois"
  smrFrequencyMonths: number; // ex: 6
  smrFrequencyLabel: string; // "Tous les 6 mois"
  reminderLeadDays: number; // ex: 30
  reminderLeadLabel: string; // "30 jours avant"
  updatedAt: Date;
}

export interface UpdateVisitPeriodicityInput {
  standardFrequencyMonths: number;
  smrFrequencyMonths: number;
  reminderLeadDays: number;
}

export type PeriodicVisitStatus = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE';

export interface DueEmployeeItem {
  patientId: string;
  matricule: string;
  fullName: string;
  department: string | null;
  jobTitle: string | null;
  isSmr: boolean; // Suivi Médical Renforcé (postes à risques)
  smrReason: string | null;
  frequencyMonths: number;
  lastVisitDate: Date | null;
  lastVisitFormatted: string;
  nextDueDate: Date;
  nextDueDateFormatted: string;
  daysRemaining: number;
  status: PeriodicVisitStatus;
  statusLabel: string;
}

export interface DueEmployeesSummaryResponse {
  totalEmployees: number;
  upToDateCount: number;
  dueSoonCount: number;
  overdueCount: number;
  smrCount: number;
  coverageRatePercent: number; // Taux de couverture médicale
  employees: DueEmployeeItem[];
}
