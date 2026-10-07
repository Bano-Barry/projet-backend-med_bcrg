/**
 * @file prescription-pdf.service.ts
 * @description Moteur de generation du document PDF officiel d'ordonnance medicale BCRG.
 * Conforme a la charte graphique de la Banque Centrale de la Republique de Guinee :
 * - Logo officiel bcrg_logo_descri_coul_288.png centre en en-tete
 * - Couleurs officielles : Vert fonce Pantone 567 C (#1D433B) et Dore Pantone 456 C (#B49C10)
 * - Typographies : LaGuinze pour les titres, Verdana pour le corps de texte
 * - Format strictly 1 page A4
 */

import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { PrescriptionPdfData } from './documents.types';

export class PrescriptionPdfService {
  /**
   * Formate une date en francais (ex: 07 octobre 2026).
   */
  private formatDate(date: Date): string {
    const months = [
      'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Enregistre les typographies officielles BCRG (LaGuinze et Verdana) dans PDFKit.
   * Dispose de fallbacks Helvetica au cas ou les fichiers ne seraient pas disponibles.
   */
  private registerCustomFonts(doc: PDFKit.PDFDocument): {
    titleFontBold: string;
    titleFontRegular: string;
    bodyFontRegular: string;
    bodyFontBold: string;
    bodyFontItalic: string;
  } {
    const laguinzeBoldPath = path.join(
      process.cwd(),
      'public/assets/typo/Typographies/LaGuinze_font/LaGuinze_Font/LaGuinze_WEBFONT/LaGuinze-Bold.ttf'
    );
    const laguinzeRegularPath = path.join(
      process.cwd(),
      'public/assets/typo/Typographies/LaGuinze_font/LaGuinze_Font/LaGuinze_WEBFONT/LaGuinze-Regular.ttf'
    );
    const verdanaRegularPath = path.join(
      process.cwd(),
      'public/assets/typo/Typographies/Verdana_font/Verdana-Regular.ttf'
    );
    const verdanaBoldPath = path.join(
      process.cwd(),
      'public/assets/typo/Typographies/Verdana_font/Verdana-Bold.ttf'
    );
    const verdanaItalicPath = path.join(
      process.cwd(),
      'public/assets/typo/Typographies/Verdana_font/Verdana-Italic.ttf'
    );

    let titleFontBold = 'Helvetica-Bold';
    let titleFontRegular = 'Helvetica';
    let bodyFontRegular = 'Helvetica';
    let bodyFontBold = 'Helvetica-Bold';
    let bodyFontItalic = 'Helvetica-Oblique';

    if (fs.existsSync(laguinzeBoldPath)) {
      doc.registerFont('LaGuinze-Bold', laguinzeBoldPath);
      titleFontBold = 'LaGuinze-Bold';
    }
    if (fs.existsSync(laguinzeRegularPath)) {
      doc.registerFont('LaGuinze', laguinzeRegularPath);
      titleFontRegular = 'LaGuinze';
    }
    if (fs.existsSync(verdanaRegularPath)) {
      doc.registerFont('Verdana', verdanaRegularPath);
      bodyFontRegular = 'Verdana';
    }
    if (fs.existsSync(verdanaBoldPath)) {
      doc.registerFont('Verdana-Bold', verdanaBoldPath);
      bodyFontBold = 'Verdana-Bold';
    }
    if (fs.existsSync(verdanaItalicPath)) {
      doc.registerFont('Verdana-Italic', verdanaItalicPath);
      bodyFontItalic = 'Verdana-Italic';
    }

    return {
      titleFontBold,
      titleFontRegular,
      bodyFontRegular,
      bodyFontBold,
      bodyFontItalic,
    };
  }

  /**
   * Genere le buffer binaire du document PDF de l'ordonnance medicale.
   * Mise en page stricte sur une seule page A4.
   *
   * @param data Donnees completes de consultation, prescripteur, patient et ordonnance
   * @returns Buffer binaire du PDF genere
   */
  async generatePrescriptionPdf(data: PrescriptionPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 20, left: 38, right: 38 },
        autoFirstPage: true,
        info: {
          Title: `Ordonnance - ${data.patient.firstName} ${data.patient.lastName}`,
          Author: `Dr. ${data.doctor.firstName} ${data.doctor.lastName}`,
          Subject: 'Ordonnance Medicale - Infirmerie Centrale BCRG',
          Keywords: 'BCRG, ordonnance, sante, medical',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Typographies officielles BCRG
      const fonts = this.registerCustomFonts(doc);

      // Couleurs officielles selon la charte graphique BCRG
      const primaryColor = '#1D433B';   // Pantone 567 C (Vert fonce institutionnel)
      const secondaryColor = '#B49C10'; // Pantone 456 C (Dore / Vert clair institutionnel)
      const darkColor = '#1D2623';      // Texte sombre haute lisibilite
      const mutedColor = '#5D6D66';     // Texte secondaire
      const borderColor = '#DCE4E1';    // Lignes et cadres
      const cardBg = '#F6F8F7';         // Fond doux des blocs

      const pageWidth = doc.page.width;
      const leftMargin = 38;
      const contentWidth = pageWidth - leftMargin * 2;

      // 1. BANDEAU DECORATIF SUPERIEUR
      doc
        .rect(leftMargin, 16, contentWidth, 3)
        .fill(primaryColor);

      // 2. LOGO BCRG OFFICIEL BIEN CENTRE
      const possibleLogoPaths = [
        path.join(process.cwd(), 'public', 'images', 'bcrg_logo_descri_coul_288.png'),
        path.join(process.cwd(), 'resources', 'bcrg_logo_descri_coul_288.png'),
      ];
      const logoPath = possibleLogoPaths.find((p) => fs.existsSync(p));
      const logoWidth = 92;
      const logoX = (pageWidth - logoWidth) / 2;

      if (logoPath) {
        doc.image(logoPath, logoX, 24, { width: logoWidth });
      }

      // Mentions institutionnelles sous le logo (le logo integre deja "BCRG" et "Banque Centrale...")
      let currentY = 103;

      doc
        .fontSize(7.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text('DIRECTION DES RESSOURCES HUMAINES • SERVICE MEDICAL', leftMargin, currentY, {
          align: 'center',
          width: contentWidth,
        });

      currentY += 11;
      doc
        .fontSize(8)
        .font(fonts.titleFontBold)
        .fillColor(secondaryColor)
        .text('INFIRMERIE CENTRALE - CONAKRY', leftMargin, currentY, {
          align: 'center',
          width: contentWidth,
        });

      currentY += 13;
      doc
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .strokeColor(borderColor)
        .lineWidth(0.8)
        .stroke();

      // 3. TITRE & REFERENCE DU DOCUMENT
      currentY += 10;
      doc
        .fontSize(14)
        .font(fonts.titleFontBold)
        .fillColor(primaryColor)
        .text('ORDONNANCE MEDICALE', leftMargin, currentY, {
          align: 'center',
          width: contentWidth,
        });

      currentY += 17;
      const dateStr = this.formatDate(data.consultationDate);
      doc
        .fontSize(7.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text(`Ref : ${data.reference}  •  Delivree le ${dateStr}`, leftMargin, currentY, {
          align: 'center',
          width: contentWidth,
        });

      // 4. CADRE D'INFORMATIONS : MEDECIN & PATIENT (Compact et elegant)
      currentY += 14;
      const boxHeight = 62;
      const colWidth = (contentWidth - 20) / 2;

      doc
        .roundedRect(leftMargin, currentY, contentWidth, boxHeight, 4)
        .fillAndStroke(cardBg, borderColor);

      // Colonne Gauche : Medecin
      const docColX = leftMargin + 12;
      doc
        .fontSize(7)
        .font(fonts.titleFontBold)
        .fillColor(primaryColor)
        .text('MEDECIN PRESCRIPTEUR', docColX, currentY + 8);

      doc
        .fontSize(8.5)
        .font(fonts.bodyFontBold)
        .fillColor(darkColor)
        .text(`Dr. ${data.doctor.firstName} ${data.doctor.lastName}`, docColX, currentY + 19);

      doc
        .fontSize(7.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text(data.doctor.jobTitle || 'Medecin Traitant - Infirmerie BCRG', docColX, currentY + 31, {
          width: colWidth - 15,
        });

      if (data.doctor.matricule) {
        doc
          .fontSize(7)
          .font(fonts.bodyFontRegular)
          .fillColor(mutedColor)
          .text(`Matricule pro : ${data.doctor.matricule}`, docColX, currentY + 43);
      }

      // Separateur vertical central
      doc
        .moveTo(leftMargin + colWidth + 10, currentY + 6)
        .lineTo(leftMargin + colWidth + 10, currentY + boxHeight - 6)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      // Colonne Droite : Patient
      const patColX = leftMargin + colWidth + 22;
      doc
        .fontSize(7)
        .font(fonts.titleFontBold)
        .fillColor(primaryColor)
        .text('PATIENT / COLLABORATEUR', patColX, currentY + 8);

      doc
        .fontSize(8.5)
        .font(fonts.bodyFontBold)
        .fillColor(darkColor)
        .text(`${data.patient.firstName} ${data.patient.lastName}`, patColX, currentY + 19);

      const dept = data.patient.department ? ` • ${data.patient.department}` : '';
      doc
        .fontSize(7.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text(`Matricule : ${data.patient.matricule}${dept}`, patColX, currentY + 31, {
          width: colWidth - 20,
        });

      const patientDetails = [
        data.patient.jobTitle ? `Poste : ${data.patient.jobTitle}` : null,
        data.patient.bloodGroup ? `Groupe : ${data.patient.bloodGroup}` : null,
      ].filter(Boolean).join('  |  ');

      if (patientDetails) {
        doc
          .fontSize(7)
          .font(fonts.bodyFontRegular)
          .fillColor(mutedColor)
          .text(patientDetails, patColX, currentY + 43, { width: colWidth - 20 });
      }

      // 5. CORPS DE L'ORDONNANCE (PRESCRIPTIONS)
      currentY += boxHeight + 14;

      doc
        .fontSize(9)
        .font(fonts.titleFontBold)
        .fillColor(primaryColor)
        .text('PRESCRIPTION MEDICAMENTEUSE (Rp/)', leftMargin, currentY);

      currentY += 12;
      doc
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .strokeColor(primaryColor)
        .lineWidth(1)
        .stroke();

      currentY += 10;

      if (!data.prescriptions || data.prescriptions.length === 0) {
        doc
          .fontSize(8.5)
          .font(fonts.bodyFontItalic)
          .fillColor(mutedColor)
          .text('Aucun medicament prescrit dans cette consultation.', leftMargin + 8, currentY);
        currentY += 20;
      } else {
        // Calibrer l'interligne selon le nombre de prescriptions pour garantir strictement 1 page
        const count = data.prescriptions.length;
        const lineSpacing = count > 4 ? 9 : 12;

        data.prescriptions.forEach((item, index) => {
          // Ligne 1 : Nom medicament + Dosage
          doc
            .fontSize(8.5)
            .font(fonts.bodyFontBold)
            .fillColor(darkColor)
            .text(`${index + 1}.  ${item.medicationName.toUpperCase()}`, leftMargin + 8, currentY, {
              continued: true,
            })
            .font(fonts.bodyFontBold)
            .fillColor(secondaryColor)
            .text(`  —  ${item.dosage}`);

          currentY += lineSpacing;

          // Ligne 2 : Posologie & Duree
          const poso = item.frequency ? `${item.dosage}, ${item.frequency}` : item.dosage;
          doc
            .fontSize(7.5)
            .font(fonts.bodyFontRegular)
            .fillColor(darkColor)
            .text('Posologie : ', leftMargin + 22, currentY, { continued: true })
            .font(fonts.bodyFontRegular)
            .fillColor(mutedColor)
            .text(`${poso}  |  Duree : ${item.duration}`);

          currentY += lineSpacing - 1;

          // Ligne 3 : Instructions eventuelles
          if (item.instructions && item.instructions.trim()) {
            doc
              .fontSize(7)
              .font(fonts.bodyFontItalic)
              .fillColor(mutedColor)
              .text(`Instructions : ${item.instructions.trim()}`, leftMargin + 22, currentY);
            currentY += lineSpacing - 2;
          }

          currentY += count > 4 ? 3 : 5;
        });
      }

      // 6. CONSEILS MEDICAUX / RECOMMANDATIONS (si applicables)
      if (data.advice && data.advice.trim()) {
        currentY += 6;
        doc
          .fontSize(8)
          .font(fonts.titleFontBold)
          .fillColor(secondaryColor)
          .text('CONSEILS & RECOMMANDATIONS DU MEDECIN :', leftMargin + 8, currentY);

        currentY += 10;
        doc
          .fontSize(7.5)
          .font(fonts.bodyFontRegular)
          .fillColor(darkColor)
          .text(data.advice.trim(), leftMargin + 8, currentY, {
            width: contentWidth - 16,
          });
      }

      // 7. ZONE BASSE FIXE (GARANTIE 1 PAGE SANS SAUT DE PAGE)
      // La hauteur A4 est de 841.89pt. Le pied de page est verrouille a Y = 710.
      const footerY = 710;

      // Mentions date et validite
      doc
        .fontSize(7.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text(`Fait a Conakry, le ${dateStr}`, leftMargin, footerY);

      doc
        .fontSize(6.5)
        .font(fonts.bodyFontItalic)
        .fillColor(mutedColor)
        .text('Document officiel delivre pour servir et valoir ce que de droit.', leftMargin, footerY + 11);

      // Boite Cachet & Signature du Medecin
      const stampBoxWidth = 165;
      const stampBoxHeight = 58;
      const stampBoxX = leftMargin + contentWidth - stampBoxWidth;
      const stampBoxY = footerY - 10;

      doc
        .roundedRect(stampBoxX, stampBoxY, stampBoxWidth, stampBoxHeight, 3)
        .strokeColor(borderColor)
        .lineWidth(0.8)
        .dash(3, { space: 3 })
        .stroke();

      doc.undash();

      doc
        .fontSize(7)
        .font(fonts.titleFontBold)
        .fillColor(primaryColor)
        .text('Cachet & Signature du Medecin', stampBoxX + 6, stampBoxY + 6, {
          width: stampBoxWidth - 12,
          align: 'center',
        });

      doc
        .fontSize(7.5)
        .font(fonts.bodyFontBold)
        .fillColor(darkColor)
        .text(`Dr. ${data.doctor.firstName} ${data.doctor.lastName}`, stampBoxX + 6, stampBoxY + stampBoxHeight - 14, {
          width: stampBoxWidth - 12,
          align: 'center',
        });

      // Ligne institutionnelle et confidentielle tout en bas (Y = 810 sur 841.89)
      doc
        .fontSize(6.5)
        .font(fonts.bodyFontRegular)
        .fillColor(mutedColor)
        .text(
          'Infirmerie Centrale de la Banque Centrale de la Republique de Guinee (BCRG) • BP 692 Conakry • Confidentiel Medical',
          leftMargin,
          810,
          { align: 'center', width: contentWidth }
        );

      doc.end();
    });
  }
}

export const prescriptionPdfService = new PrescriptionPdfService();
