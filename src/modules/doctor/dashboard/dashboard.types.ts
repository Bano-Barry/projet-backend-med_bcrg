/**
 * @file dashboard.types.ts
 * @description Types et contrats d'interfaces pour le tableau de bord medecin (Dashboard).
 */

export interface DoctorDashboardKpis {
  /** Nombre de consultations du jour (00:00 a 23:59) */
  consultationsToday: number;
  /** Nombre de consultations actuellement actives (EN COURS / EN ATTENTE) */
  activeConsultations: number;
  /** Nombre total de departements organisationnels distincts */
  departmentsCount: number;
  /** Nombre d'employes / patients uniques ayant deja passe au moins une consultation */
  patientsExaminedCount: number;
  /** Nombre total d'utilisateurs actifs du systeme */
  usersCount: number;
}

export interface DiabetesKpis {
  /** Nombre de patients diabétiques suivis */
  diabeticPatients: number;
  /** Total des contrôles glycémiques réalisés */
  glycemiaChecks: number;
  /** Nombre de bandelettes consommées (1 contrôle = 1 bandelette) */
  stripConsumption: number;
  /** Stock théorique restant (initial - consommées) */
  remainingStrips: number;
}

export interface DiabeticPatientMonthlyPassage {
  patientId: string;
  patientName: string;
  registrationNumber: string;
  department?: string | null;
  monthlyVisits: number;
  lastCheckDate?: string | null;
  lastGlycemiaValue?: number | null;
  lastGlycemiaUnit?: string | null;
}

export interface WeeklyActivityItem {
  /** Nom abrege du jour (LUN, MAR, MER, JEU, VEN, SAM, DIM) */
  day: string;
  /** Date associee (format YYYY-MM-DD) */
  date: string;
  /** Nombre de consultations realisees ce jour-la */
  count: number;
}

export interface DoctorAlertItem {
  id: string;
  type: 'STOCK_ALERT' | 'MEDICAL_VISIT' | 'RECORD_APPROVAL' | 'GENERAL';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

export interface DoctorAlertsData {
  pendingCount: number;
  items: DoctorAlertItem[];
}

export interface RecentConsultationItem {
  id: string;
  patientName: string;
  patientMatricule: string;
  consultationDate: string;
  formattedDate: string;
  type: string;
  typeLabel: string;
  status: string;
  statusLabel: string;
}

export interface QuickActionItem {
  key: string;
  label: string;
  subtitle: string;
  route: string;
}

export interface DoctorDashboardData {
  kpis: DoctorDashboardKpis;
  diabetesKpis: DiabetesKpis;
  diabeticMonthlyPassages: DiabeticPatientMonthlyPassage[];
  weeklyActivity: WeeklyActivityItem[];
  alerts: DoctorAlertsData;
  recentConsultations: RecentConsultationItem[];
  quickActions: QuickActionItem[];
}
