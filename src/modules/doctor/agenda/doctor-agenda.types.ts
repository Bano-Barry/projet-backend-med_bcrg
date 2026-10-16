/**
 * @file doctor-agenda.types.ts
 * @description Types et interfaces pour l'agenda et la gestion des rendez-vous par le médecin.
 */

import { ConsultationType, AppointmentStatus } from '@prisma/client';

export interface DoctorAgendaItem {
  id: string;
  appointmentDate: string; // YYYY-MM-DD
  formattedDate: string; // "Jeudi 15 Octobre 2026"
  scheduledTime: string; // "09:30"
  durationMinutes: number;
  type: ConsultationType;
  typeLabel: string;
  status: AppointmentStatus;
  statusLabel: string;
  statusColor: 'yellow' | 'green' | 'blue' | 'gray' | 'red';
  patientId: string;
  patientName: string;
  patientMatricule: string;
  patientDepartment?: string | null;
  patientGender?: string | null;
  patientPhone?: string | null;
  reason: string | null;
  doctorNotes?: string | null;
  cancellationReason?: string | null;
  createdAt: Date;
}

export interface DoctorDayAgendaResponse {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Jeudi 15 Octobre"
  totalAppointments: number;
  appointments: DoctorAgendaItem[];
}

export interface RescheduleAppointmentInput {
  newDate: string; // YYYY-MM-DD
  newTime: string; // HH:mm
  reason?: string | null;
}

export interface ApproveAppointmentInput {
  doctorNotes?: string | null;
}

export interface CancelAppointmentInput {
  reason: string;
}
