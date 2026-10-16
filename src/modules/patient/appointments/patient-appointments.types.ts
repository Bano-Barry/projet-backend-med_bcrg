/**
 * @file patient-appointments.types.ts
 * @description Types et interfaces pour la prise de rendez-vous de l'espace Patient (/api/patient/appointments).
 */

import { ConsultationType, AppointmentStatus } from '@prisma/client';

export interface AvailableDayItem {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  dayName: string; // "Lundi", "Mardi", etc.
  isPast: boolean;
  isWeekend: boolean;
  isAvailable: boolean; // Ouvert et créneaux restants
  availableSlotsCount: number;
}

export interface AvailableDaysResponse {
  month: string; // YYYY-MM
  days: AvailableDayItem[];
}

export interface AvailableSlotsResponse {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Vendredi 16 Octobre 2026"
  isWorkingDay: boolean;
  totalSlots: number;
  availableSlots: string[]; // ["08:00", "08:30", "09:00", ...]
  occupiedSlots: string[];
}

export interface BookAppointmentInput {
  appointmentDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm (ex: "09:00")
  type: ConsultationType; // GENERAL, INSTANT, PERIODIC
  reason?: string | null;
}

export interface PatientAppointmentItem {
  id: string;
  appointmentDate: string; // YYYY-MM-DD
  formattedDate: string;
  scheduledTime: string; // "09:00"
  durationMinutes: number;
  type: ConsultationType;
  typeLabel: string;
  status: AppointmentStatus;
  statusLabel: string;
  statusColor: 'yellow' | 'green' | 'blue' | 'gray' | 'red';
  reason: string | null;
  doctorNotes: string | null;
  cancellationReason: string | null;
  doctorId: string | null;
  doctorName: string | null;
  createdAt: Date;
}
