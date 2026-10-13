/**
 * @file hr-report-pdf.service.ts
 * @description Moteur de generation du rapport d'activite et de synthese RH en PDF.
 * Conforme a la charte officielle BCRG :
 * - Couleurs officielles : Vert fonce (#1D433B) et Dore (#B49C10)
 * - Aucune donnee nominative de sante (secret medical strict)
 */

import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { HrDashboardData, HrDiabetesStatisticsData, HrStatisticsData } from './hr.types';

export interface HrReportPdfData {
  generatedAt: Date;
  dashboard: HrDashboardData;
  statistics: HrStatisticsData;
  diabetes: HrDiabetesStatisticsData;
}

export class HrReportPdfService {
  private formatDate(date: Date): string {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  async buildReportPdf(data: HrReportPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: 'Rapport d\'Activite Medicale RH - BCRG',
          Author: 'Banque Centrale de la Republique de Guinee',
          Subject: 'Synthese RH et Suivi d\'Activite de l\'Infirmerie',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const PRIMARY_COLOR = '#1D433B';
      const GOLD_COLOR = '#B49C10';
      const TEXT_COLOR = '#1F2937';
      const MUTED_COLOR = '#6B7280';
      const BG_CARD = '#F9FAFB';

      // 1. Logo BCRG si disponible
      const logoPath = path.join(process.cwd(), 'resources/bcrg_logo_descri_coul_288.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 105 });
      }

      // En-tête institutionnel à droite
      doc
        .fontSize(12)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('BANQUE CENTRALE DE LA RÉPUBLIQUE DE GUINÉE', 150, 32, { align: 'right', width: 405 });

      doc
        .fontSize(9)
        .fillColor(GOLD_COLOR)
        .font('Helvetica-Bold')
        .text('DIRECTION DES RESSOURCES HUMAINES & INFIRMERIE', 150, 52, { align: 'right', width: 405 });

      doc
        .fontSize(8)
        .fillColor(MUTED_COLOR)
        .font('Helvetica')
        .text(`Date d'émission : ${this.formatDate(data.generatedAt)} | Conakry, République de Guinée`, 150, 68, { align: 'right', width: 405 });

      // Ligne de séparation
      doc
        .moveTo(40, 92)
        .lineTo(555, 92)
        .strokeColor(GOLD_COLOR)
        .lineWidth(1.5)
        .stroke();

      // Titre du document
      doc
        .fontSize(13)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('RAPPORT DE SYNTHÈSE D\'ACTIVITÉ MÉDICALE RH', 40, 108, { align: 'center' });

      doc
        .fontSize(8.5)
        .fillColor(MUTED_COLOR)
        .font('Helvetica-Oblique')
        .text('Données consolidées et anonymisées conformément aux règles de confidentialité et du secret médical', 40, 126, { align: 'center' });

      // 2. Encadré Synthèse Effectifs & Activité
      doc
        .roundedRect(40, 150, 515, 78, 4)
        .fillAndStroke(BG_CARD, '#E5E7EB');

      doc
        .fontSize(9.5)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('INDICATEURS CLÉS DU MOIS', 52, 160);

      const kpiY = 180;
      // Col 1 : Effectif
      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('COLLABORATEURS ACTIFS', 52, kpiY, { width: 110 });
      doc.fontSize(15).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.dashboard.activeEmployees}`, 52, kpiY + 16);

      // Col 2 : Consultations
      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('CONSULTATIONS DU MOIS', 175, kpiY, { width: 110 });
      doc.fontSize(15).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.dashboard.totalConsultationsThisMonth}`, 175, kpiY + 16);

      // Col 3 : Arrêts de travail
      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('JOURS D\'ARRÊT (MOIS)', 305, kpiY, { width: 110 });
      doc.fontSize(15).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.dashboard.totalSickLeaveDaysThisMonth} j`, 305, kpiY + 16);

      // Col 4 : En arrêt actuellement
      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('EN ARRÊT ACTUELLEMENT', 430, kpiY, { width: 115 });
      doc.fontSize(15).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.dashboard.employeesOnSickLeaveCurrent}`, 430, kpiY + 16);

      // 3. Encadré Suivi Glycémique et Diabète
      doc
        .roundedRect(40, 242, 515, 78, 4)
        .fillAndStroke(BG_CARD, '#E5E7EB');

      doc
        .fontSize(9.5)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('SUIVI DU DIABÈTE ET FOURNITURES (BANDELETTES)', 52, 252);

      const dKpiY = 272;
      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('PATIENTS DIABÉTIQUES', 52, dKpiY, { width: 110 });
      doc.fontSize(14).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.diabetes.diabeticPatients}`, 52, dKpiY + 16);

      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('TESTS RÉALISÉS', 175, dKpiY, { width: 110 });
      doc.fontSize(14).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.diabetes.glycemiaChecks}`, 175, dKpiY + 16);

      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('BANDELETTES CONSOMMÉES', 305, dKpiY, { width: 120 });
      doc.fontSize(14).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(`${data.diabetes.stripConsumption}`, 305, dKpiY + 16);

      doc.fontSize(7.5).fillColor(MUTED_COLOR).font('Helvetica').text('STOCK RESTANT', 430, dKpiY, { width: 115 });
      doc.fontSize(14).fillColor(GOLD_COLOR).font('Helvetica-Bold').text(`${data.diabetes.remainingStrips}`, 430, dKpiY + 16);

      // 4. Tableau par Direction
      doc
        .fontSize(10)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('RÉPARTITION PAR DIRECTION / SERVICE', 40, 335);

      // En-têtes du tableau
      const tableTop = 345;
      doc
        .rect(40, tableTop, 515, 20)
        .fill(PRIMARY_COLOR);

      doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.text('DIRECTION / DÉPARTEMENT', 50, tableTop + 5);
      doc.text('EFFECTIF', 280, tableTop + 5, { width: 70, align: 'right' });
      doc.text('CONSULTATIONS', 360, tableTop + 5, { width: 85, align: 'right' });
      doc.text('JOURS D\'ARRÊT', 455, tableTop + 5, { width: 90, align: 'right' });

      let currentY = tableTop + 20;
      doc.font('Helvetica').fontSize(8);

      const depts = data.statistics.byDepartment.slice(0, 14); // Limiter à la page
      depts.forEach((dept, index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        doc.rect(40, currentY, 515, 18).fill(rowBg);

        doc.fillColor(TEXT_COLOR);
        doc.text(dept.department || 'Direction non affectée', 50, currentY + 5, { width: 220, ellipsis: true });
        doc.text(`${dept.employeeCount}`, 280, currentY + 5, { width: 70, align: 'right' });
        doc.text(`${dept.consultationCount}`, 360, currentY + 5, { width: 85, align: 'right' });
        doc.text(`${dept.sickLeaveDays} j`, 455, currentY + 5, { width: 90, align: 'right' });

        currentY += 18;
      });

      // Ligne de pied de tableau
      doc
        .moveTo(40, currentY)
        .lineTo(555, currentY)
        .strokeColor('#E5E7EB')
        .stroke();

      // Bas de page
      const footerY = 770;
      doc
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .strokeColor(GOLD_COLOR)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(7)
        .fillColor(MUTED_COLOR)
        .font('Helvetica')
        .text('Banque Centrale de la République de Guinée - Infirmerie & Service Médical - Document d\'usage interne RH', 40, footerY + 8, { align: 'center' });

      doc.end();
    });
  }
}

export const hrReportPdfService = new HrReportPdfService();
