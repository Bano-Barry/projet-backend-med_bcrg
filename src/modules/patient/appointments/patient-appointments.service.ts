/**
 * @file patient-appointments.service.ts
 * @description Logique métier de réservation et consultation des rendez-vous pour le collaborateur.
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { NotFoundError, BadRequestError } from '../../../core/errors';
import { ConsultationType, AppointmentStatus, Appointment } from '@prisma/client';
import {
  AvailableDaysResponse,
  AvailableDayItem,
  AvailableSlotsResponse,
  BookAppointmentInput,
  PatientAppointmentItem,
} from './patient-appointments.types';

// Créneaux horaires d'ouverture de l'infirmerie BCRG (08h00 - 17h00)
export const STANDARD_DAILY_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

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

export class PatientAppointmentsService {
  /**
   * Formate une date en français (ex: "Vendredi 16 Octobre 2026").
   */
  private formatFrenchDate(date: Date): string {
    const dayName = FRENCH_DAYS[date.getDay()];
    const dayNum = date.getDate();
    const monthName = FRENCH_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} ${dayNum} ${monthName} ${year}`;
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
   * Récupère la fiche patient à partir de l'ID utilisateur authentifié.
   */
  private async getPatientByUserId(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundError(
        'Fiche collaborateur introuvable. Veuillez contacter les Ressources Humaines.'
      );
    }
    return patient;
  }

  /**
   * Retourne la disponibilité jour par jour pour un mois donné (ex: 2026-10).
   */
  async getAvailableDays(monthStr: string): Promise<AvailableDaysResponse> {
    const [yearStr, mStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(mStr, 10) - 1; // 0-indexé

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month, daysInMonth, 23, 59, 59);

    // Récupérer les rendez-vous actifs du mois pour calculer le remplissage
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
      select: {
        appointmentDate: true,
      },
    });

    // Compter les RDV par date string (YYYY-MM-DD)
    const countByDate = new Map<string, number>();
    for (const app of activeAppointments) {
      const dStr = app.appointmentDate.toISOString().split('T')[0];
      countByDate.set(dStr, (countByDate.get(dStr) || 0) + 1);
    }

    const totalDailySlots = STANDARD_DAILY_SLOTS.length;
    const days: AvailableDayItem[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(year, month, day);
      const dayOfWeek = current.getDay(); // 0=Dimanche, 6=Samedi
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = current < today;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const occupied = countByDate.get(dateStr) || 0;
      const remainingSlots = Math.max(0, totalDailySlots - occupied);

      const isAvailable = !isWeekend && !isPast && remainingSlots > 0;

      days.push({
        date: dateStr,
        dayNumber: day,
        dayOfWeek,
        dayName: FRENCH_DAYS[dayOfWeek],
        isPast,
        isWeekend,
        isAvailable,
        availableSlotsCount: isAvailable ? remainingSlots : 0,
      });
    }

    return {
      month: monthStr,
      days,
    };
  }

  /**
   * Retourne les créneaux disponibles pour une date donnée (ex: 2026-10-16).
   */
  async getAvailableSlots(dateStr: string): Promise<AvailableSlotsResponse> {
    const targetDate = new Date(`${dateStr}T00:00:00Z`);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Format de date invalide (attendu: YYYY-MM-DD)');
    }

    const dayOfWeek = targetDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = targetDate < today;

    // Récupérer les créneaux déjà réservés
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: targetDate,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
      select: {
        scheduledTime: true,
      },
    });

    const occupiedSlots = existingAppointments.map((a) => a.scheduledTime);
    const availableSlots = isWeekend || isPast
      ? []
      : STANDARD_DAILY_SLOTS.filter((slot) => !occupiedSlots.includes(slot));

    return {
      date: dateStr,
      formattedDate: this.formatFrenchDate(targetDate),
      isWorkingDay: !isWeekend,
      totalSlots: STANDARD_DAILY_SLOTS.length,
      availableSlots,
      occupiedSlots,
    };
  }

  /**
   * Enregistre une réservation de rendez-vous pour le collaborateur connecté.
   */
  async bookAppointment(
    userId: string,
    input: BookAppointmentInput
  ): Promise<PatientAppointmentItem> {
    const patient = await this.getPatientByUserId(userId);

    const targetDate = new Date(`${input.appointmentDate}T00:00:00Z`);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Format de date invalide');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      throw new BadRequestError('Impossible de réserver un rendez-vous dans le passé');
    }

    const dayOfWeek = targetDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const dayName = dayOfWeek === 0 ? 'un dimanche' : 'un samedi';
      throw new BadRequestError(
        `L'infirmerie BCRG est fermée les week-ends (samedis et dimanches). La date sélectionnée (${input.appointmentDate}) tombe ${dayName}. Veuillez choisir un jour ouvré du lundi au vendredi.`
      );
    }

    if (!STANDARD_DAILY_SLOTS.includes(input.scheduledTime)) {
      throw new BadRequestError(
        `Créneau horaire non valide. Veuillez choisir parmi : ${STANDARD_DAILY_SLOTS.join(', ')}`
      );
    }

    // Vérifier si le créneau est déjà pris par un autre patient
    const existingSlot = await prisma.appointment.findFirst({
      where: {
        appointmentDate: targetDate,
        scheduledTime: input.scheduledTime,
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

    if (existingSlot) {
      throw new BadRequestError('Ce créneau horaire vient déjà d\'être réservé. Veuillez en choisir un autre.');
    }

    // Vérifier si le patient n'a pas déjà un rendez-vous le même jour à la même heure
    const duplicatePatientAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        appointmentDate: targetDate,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
          ],
        },
      },
    });

    if (duplicatePatientAppointment) {
      throw new BadRequestError(
        'Vous avez déjà un rendez-vous programmé à cette date. Vous pouvez le reprogrammer ou l\'annuler si nécessaire.'
      );
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        appointmentDate: targetDate,
        scheduledTime: input.scheduledTime,
        type: input.type,
        status: AppointmentStatus.SCHEDULED,
        reason: input.reason ? input.reason.trim() : null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const statusMeta = this.getStatusMetadata(newAppointment.status);

    return {
      id: newAppointment.id,
      appointmentDate: input.appointmentDate,
      formattedDate: this.formatFrenchDate(targetDate),
      scheduledTime: newAppointment.scheduledTime,
      durationMinutes: newAppointment.durationMinutes,
      type: newAppointment.type,
      typeLabel: this.getTypeLabel(newAppointment.type),
      status: newAppointment.status,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      reason: newAppointment.reason,
      doctorNotes: newAppointment.doctorNotes,
      cancellationReason: newAppointment.cancellationReason,
      doctorId: newAppointment.doctorId,
      doctorName: newAppointment.doctor
        ? `Dr. ${newAppointment.doctor.firstName} ${newAppointment.doctor.lastName}`
        : null,
      createdAt: newAppointment.createdAt,
    };
  }

  /**
   * Retourne tous les rendez-vous du collaborateur connecté.
   */
  async getMyAppointments(userId: string): Promise<PatientAppointmentItem[]> {
    const patient = await this.getPatientByUserId(userId);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { scheduledTime: 'desc' },
      ],
    });

    return appointments.map((app) => {
      const statusMeta = this.getStatusMetadata(app.status);
      const dateStr = app.appointmentDate.toISOString().split('T')[0];

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
        reason: app.reason,
        doctorNotes: app.doctorNotes,
        cancellationReason: app.cancellationReason,
        doctorId: app.doctorId,
        doctorName: app.doctor
          ? `Dr. ${app.doctor.firstName} ${app.doctor.lastName}`
          : null,
        createdAt: app.createdAt,
      };
    });
  }

  /**
   * Annule un rendez-vous par le collaborateur.
   */
  async cancelAppointment(
    userId: string,
    appointmentId: string,
    reason?: string | null
  ): Promise<{ success: boolean; message: string }> {
    const patient = await this.getPatientByUserId(userId);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.patientId !== patient.id) {
      throw new NotFoundError('Rendez-vous introuvable dans votre espace personnel');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestError('Ce rendez-vous est déjà annulé');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestError('Impossible d\'annuler une consultation déjà effectuée');
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason?.trim() || 'Annulé par le patient',
      },
    });

    return {
      success: true,
      message: 'Votre rendez-vous a été annulé avec succès.',
    };
  }
}

export const patientAppointmentsService = new PatientAppointmentsService();
