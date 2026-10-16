/**
 * @file doctor-agenda.service.ts
 * @description Service métier pour l'agenda et la gestion des rendez-vous par le médecin.
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { NotFoundError, BadRequestError } from '../../../core/errors';
import { ConsultationType, AppointmentStatus } from '@prisma/client';
import {
  DoctorAgendaItem,
  DoctorDayAgendaResponse,
  RescheduleAppointmentInput,
  ApproveAppointmentInput,
} from './doctor-agenda.types';
import {
  STANDARD_DAILY_SLOTS,
  autoCompletePastAppointments,
} from '../../patient/appointments/patient-appointments.service';

const FRENCH_DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export class DoctorAgendaService {
  /**
   * Formate une date en français (ex: "Jeudi 15 Octobre 2026").
   */
  private formatFrenchDate(date: Date, includeYear = true): string {
    const dayName = FRENCH_DAYS[date.getDay()];
    const dayNum = date.getDate();
    const monthName = FRENCH_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return includeYear ? `${dayName} ${dayNum} ${monthName} ${year}` : `${dayName} ${dayNum} ${monthName}`;
  }

  /**
   * Traduit le type de consultation en libellé lisible.
   */
  public getTypeLabel(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.PERIODIC:
        return 'Visite Médicale Périodique';
      case ConsultationType.INSTANT:
        return 'Consultation Immédiate / Urgence';
      case ConsultationType.GENERAL:
      default:
        return 'Consultation Générale';
    }
  }

  /**
   * Traduit le statut du rendez-vous en libellé et couleur UI.
   */
  public getStatusMetadata(status: AppointmentStatus): {
    label: string;
    color: 'yellow' | 'green' | 'blue' | 'gray' | 'red';
  } {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return { label: 'PROGRAMMÉ', color: 'yellow' };
      case AppointmentStatus.CONFIRMED:
        return { label: 'CONFIRMÉ', color: 'green' };
      case AppointmentStatus.RESCHEDULED:
        return { label: 'REPROGRAMMÉ', color: 'blue' };
      case AppointmentStatus.IN_PROGRESS:
        return { label: 'EN COURS', color: 'blue' };
      case AppointmentStatus.COMPLETED:
        return { label: 'TERMINÉ', color: 'gray' };
      case AppointmentStatus.CANCELLED:
        return { label: 'ANNULÉ', color: 'red' };
      case AppointmentStatus.NO_SHOW:
        return { label: 'NON PRÉSENTÉ', color: 'red' };
      default:
        return { label: status, color: 'gray' };
    }
  }

  /**
   * Transforme un modèle Prisma Appointment en DoctorAgendaItem.
   */
  private formatAppointment(app: any): DoctorAgendaItem {
    const statusMeta = this.getStatusMetadata(app.status);
    const dateStr = app.appointmentDate.toISOString().split('T')[0];

    const patientUser = app.patient?.user;
    const patientName = patientUser
      ? `${patientUser.firstName} ${patientUser.lastName}`
      : 'Patient Anonyme';

    return {
      id: app.id,
      appointmentDate: dateStr,
      formattedDate: this.formatFrenchDate(app.appointmentDate),
      scheduledTime: app.scheduledTime,
      durationMinutes: app.durationMinutes,
      type: app.type,
      typeLabel: this.getTypeLabel(app.type),
      status: app.status,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      patientId: app.patientId,
      patientName,
      patientMatricule: patientUser?.matricule || app.patient?.registrationNumber || 'N/A',
      patientDepartment: patientUser?.department || null,
      patientGender: app.patient?.gender || null,
      patientPhone: patientUser?.phone || app.patient?.phone || null,
      reason: app.reason,
      doctorNotes: app.doctorNotes,
      cancellationReason: app.cancellationReason,
      createdAt: app.createdAt,
    };
  }

  /**
   * Récupère la liste des rendez-vous sur une plage temporelle (ex: vue Semaine ou vue Mois).
   */
  async getAgenda(startDateStr: string, endDateStr: string): Promise<DoctorAgendaItem[]> {
    // Actualisation automatique des rendez-vous dépassés de plus de 15 minutes
    await autoCompletePastAppointments();

    const startDate = new Date(`${startDateStr}T00:00:00Z`);
    const endDate = new Date(`${endDateStr}T23:59:59Z`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestError('Dates de plage invalides');
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
    });

    return appointments.map((app) => this.formatAppointment(app));
  }

  /**
   * Récupère le détail des rendez-vous d'une journée précise (pour le volet latéral droit).
   */
  async getDayDetails(dateStr: string): Promise<DoctorDayAgendaResponse> {
    // Actualisation automatique des rendez-vous dépassés de plus de 15 minutes
    await autoCompletePastAppointments();

    const targetDate = new Date(`${dateStr}T00:00:00Z`);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Format de date invalide (attendu: YYYY-MM-DD)');
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: targetDate,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    const items = appointments.map((app) => this.formatAppointment(app));

    return {
      date: dateStr,
      formattedDate: this.formatFrenchDate(targetDate, false),
      totalAppointments: items.length,
      appointments: items,
    };
  }

  /**
   * Approuve une demande de rendez-vous (passe de PROGRAMME à CONFIRME).
   */
  async approveAppointment(
    appointmentId: string,
    doctorUserId: string,
    input?: ApproveAppointmentInput
  ): Promise<DoctorAgendaItem> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Rendez-vous introuvable');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestError(`Impossible d'approuver un rendez-vous ${appointment.status}`);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CONFIRMED,
        doctorId: doctorUserId,
        doctorNotes: input?.doctorNotes?.trim() || appointment.doctorNotes,
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    return this.formatAppointment(updated);
  }

  /**
   * Reprogramme un rendez-vous sur une nouvelle date et heure.
   */
  async rescheduleAppointment(
    appointmentId: string,
    doctorUserId: string,
    input: RescheduleAppointmentInput
  ): Promise<DoctorAgendaItem> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Rendez-vous introuvable');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestError(`Impossible de reprogrammer un rendez-vous ${appointment.status}`);
    }

    const newTargetDate = new Date(`${input.newDate}T00:00:00Z`);
    if (isNaN(newTargetDate.getTime())) {
      throw new BadRequestError('Format de nouvelle date invalide');
    }

    const dayOfWeek = newTargetDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new BadRequestError('Impossible de reprogrammer un week-end');
    }

    if (!STANDARD_DAILY_SLOTS.includes(input.newTime)) {
      throw new BadRequestError(`Créneau non valide. Créneaux autorisés: ${STANDARD_DAILY_SLOTS.join(', ')}`);
    }

    // Vérifier collision
    const collision = await prisma.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        appointmentDate: newTargetDate,
        scheduledTime: input.newTime,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
    });

    if (collision) {
      throw new BadRequestError('Ce créneau horaire est déjà occupé par un autre rendez-vous');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: newTargetDate,
        scheduledTime: input.newTime,
        status: AppointmentStatus.RESCHEDULED,
        doctorId: doctorUserId,
        doctorNotes: input.reason?.trim()
          ? `Reprogrammé : ${input.reason.trim()}`
          : appointment.doctorNotes,
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    return this.formatAppointment(updated);
  }

  /**
   * Refuse ou annule un rendez-vous avec motif.
   */
  async cancelAppointment(
    appointmentId: string,
    doctorUserId: string,
    reason: string
  ): Promise<DoctorAgendaItem> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Rendez-vous introuvable');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestError('Impossible d\'annuler une consultation déjà effectuée');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        doctorId: doctorUserId,
        cancellationReason: reason.trim(),
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    return this.formatAppointment(updated);
  }
}

export const doctorAgendaService = new DoctorAgendaService();
