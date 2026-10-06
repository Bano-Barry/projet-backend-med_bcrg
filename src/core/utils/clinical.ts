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
