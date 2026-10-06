/**
 * @file clinical.ts
 * @description Fonctions utilitaires de calcul et de controle medical.
 * Fournit les calculs d'Indice de Masse Corporelle (IMC), le decodage de la tension arterielle
 * et la detection automatique des constantes vitales hors normes.
 */

export interface BmiResult {
  bmi: number;
  category: 'INSUFFISANCE_PONDERALE' | 'NORMAL' | 'SURPOIDS' | 'OBESITE_MODEREE' | 'OBESITE_SEVERE';
  label: string;
}

/**
 * Calcule l'Indice de Masse Corporelle (IMC) et retourne la categorie associee.
 *
 * @param weightKg Poids en kilogrammes
 * @param heightCm Taille en centimetres
 * @returns Objet contenant la valeur de l'IMC et son interpretation clinique
 */
export const calculateBmi = (weightKg: number, heightCm: number): BmiResult | null => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category: BmiResult['category'] = 'NORMAL';
  let label = 'Poids normal';

  if (bmi < 18.5) {
    category = 'INSUFFISANCE_PONDERALE';
    label = 'Insuffisance pondérale';
  } else if (bmi < 25) {
    category = 'NORMAL';
    label = 'Normal';
  } else if (bmi < 30) {
    category = 'SURPOIDS';
    label = 'Surpoids';
  } else if (bmi < 35) {
    category = 'OBESITE_MODEREE';
    label = 'Obésité modérée';
  } else {
    category = 'OBESITE_SEVERE';
    label = 'Obésité sévère';
  }

  return { bmi, category, label };
};

/**
 * Analyse une chaine de caractere de tension arterielle (ex: "120/80")
 * et en extrait la pression systolique et diastolique.
 *
 * @param bp Chaine de tension au format "SYS/DIA"
 * @returns Objet avec systolic et diastolic extraits sous forme d'entiers
 */
export const parseBloodPressure = (
  bp?: string
): { systolic?: number; diastolic?: number } => {
  if (!bp || typeof bp !== 'string') {
    return {};
  }

  const trimmed = bp.trim();
  const match = trimmed.match(/^(\d{2,3})\/(\d{2,3})$/);

  if (!match) {
    return {};
  }

  return {
    systolic: parseInt(match[1], 10),
    diastolic: parseInt(match[2], 10),
  };
};

export interface VitalSignParams {
  temperatureC?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
}

/**
 * Evalue si au moins une constante vitale est hors des bornes physiologiques courantes.
 *
 * @param vitals Releve des constantes vitales
 * @returns Vrai si une anomalie est detectee, faux sinon
 */
export const isVitalSignAbnormal = (vitals: VitalSignParams): boolean => {
  // Fievre (> 38.0 C) ou hypothermie (< 35.5 C)
  if (vitals.temperatureC !== undefined && vitals.temperatureC !== null) {
    if (vitals.temperatureC >= 38.0 || vitals.temperatureC <= 35.5) {
      return true;
    }
  }

  // Hypertension (> 140 / > 90) ou hypotension (< 90 / < 60)
  if (
    vitals.bloodPressureSystolic !== undefined &&
    vitals.bloodPressureSystolic !== null
  ) {
    if (vitals.bloodPressureSystolic >= 140 || vitals.bloodPressureSystolic <= 90) {
      return true;
    }
  }

  if (
    vitals.bloodPressureDiastolic !== undefined &&
    vitals.bloodPressureDiastolic !== null
  ) {
    if (vitals.bloodPressureDiastolic >= 90 || vitals.bloodPressureDiastolic <= 60) {
      return true;
    }
  }

  return false;
};
