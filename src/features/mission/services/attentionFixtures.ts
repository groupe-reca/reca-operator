/**
 * Notes « ATTENTION » de démonstration, affichées dans la carte Mission actuelle.
 *
 * ⚠️ Données **fictives** pour ce sprint : plus tard, ces consignes proviendront
 * du contrat de la résidence (via le module Routes / Supabase). Le mapping est
 * indexé par `ordre` de stop ; un ordre absent renvoie un jeu de notes par défaut
 * afin que la section soit toujours prête à l'emploi.
 */
const ATTENTION_BY_ORDRE: Record<number, string[]> = {
  1: ['Plate-bande au fond.', 'Déposer la neige côté nord.', 'Borne-fontaine près du garage.'],
  2: ['Entrée en pente — prudence.', 'Escaliers glacés.'],
  3: ['Voiture souvent stationnée à gauche.', 'Déposer la neige côté droit.'],
  4: ['Chien dans la cour arrière.', 'Ne pas bloquer la sortie de garage.'],
  5: ['Borne-fontaine devant.', 'Trottoir municipal à dégager en priorité.'],
  6: ['Allée étroite.', 'Bac de recyclage le mardi.'],
  7: ['Rampe d’accès — client à mobilité réduite.', 'Déneiger jusqu’à la porte.'],
  8: ['Plaque de glace récurrente au bas de l’entrée.'],
  9: ['Stationnement double.', 'Attention aux marches avant.'],
}

const DEFAULT_ATTENTION = ['Aucune consigne particulière.']

export function attentionNotesFor(ordre: number): string[] {
  return ATTENTION_BY_ORDRE[ordre] ?? DEFAULT_ATTENTION
}
