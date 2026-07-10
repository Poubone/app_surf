/** Libellés affichage métadonnées spot (scrape Surf-Report / Wannasurf). */

export function levelLabel(level?: string): string {
  if (level === 'beginner') return 'Débutant';
  if (level === 'advanced') return 'Confirmé / expert';
  if (level === 'expert') return 'Expert';
  return 'Intermédiaire';
}

export function bottomTypeLabel(bottomType?: string): string {
  const map: Record<string, string> = {
    sand: 'Fond sable',
    reef: 'Reef / rochers',
    rock: 'Rochers',
    cobblestone: 'Galets',
    mixed: 'Mixte',
  };
  return map[bottomType ?? ''] ?? bottomType ?? '—';
}

/** Description générique auto-générée au scrape (sans Surf-Report). */
export function isGenericDescription(text?: string): boolean {
  return !text || /— spot de surf en .+\.$/.test(text.trim());
}

/** Alertes extraites de la description (accès, niveau requis…). */
export function spotAccessWarnings(description?: string): string[] {
  if (!description || isGenericDescription(description)) return [];
  const lower = description.toLowerCase();
  const warnings: string[] = [];

  if (/inaccessible à la rame|inaccessible a la rame/.test(lower)) {
    warnings.push('Inaccessible à la rame');
  } else if (/à la rame|a la rame/.test(lower) && /difficile|long|km/.test(lower)) {
    warnings.push('Accès à la rame (long ou difficile)');
  }
  if (/professionnel|pros\b|pro\b/.test(lower) && /seul|uniquement|nécessite/.test(lower)) {
    warnings.push('Réservé aux surfeurs très expérimentés');
  }
  if (/dangereux|roc|reef|rochers/.test(lower) && !warnings.length) {
    warnings.push('Spot technique — prudence');
  }
  if (/interdit|private|privé/.test(lower)) {
    warnings.push('Accès réglementé ou privé');
  }

  return warnings;
}
