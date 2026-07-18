import type { Mission, Stop } from '../domain/types'
import { MISSION_STATUS } from '../domain/status'
import type { MissionStatus } from '../domain/status'

/**
 * Chargement de la tournée depuis un CSV statique (`/public/demo/route.csv`).
 * Source temporaire pour ce sprint : aucune base de données permanente, aucune
 * communication avec RECA App.
 *
 * Le parseur est volontairement tolérant afin d'accepter les exports terrain :
 * - séparateur `;` ou `,` (auto-détecté sur l'en-tête) ;
 * - noms de colonnes variables (`lat`/`latitude`, `lng`/`longitude`) ;
 * - colonnes optionnelles (`type`, `statut`, ...).
 *
 * Colonnes reconnues : ordre, adresse, lat|latitude, lng|longitude, type, statut.
 */

const DEMO_CSV_PATH = '/demo/route.csv'

const DEMO_MISSION_META = {
  nom: 'Route du jour',
  secteur: 'Saint-Jérôme',
} as const

/** Sépare `;` (export terrain, adresses avec virgules) de `,` selon l'en-tête. */
function detectDelimiter(headerLine: string): string {
  return headerLine.includes(';') ? ';' : ','
}

/** Découpe une ligne CSV simple (pas de champs échappés dans nos données). */
function splitCsvLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim())
}

/** Normalise un statut brut du CSV vers l'union MissionStatus (défaut EN_ATTENTE). */
function normalizeStatus(raw: string | undefined): MissionStatus {
  const value = (raw ?? '').trim().toUpperCase()
  return (MISSION_STATUS as readonly string[]).includes(value)
    ? (value as MissionStatus)
    : 'EN_ATTENTE'
}

function parseStops(csv: string): Stop[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length <= 1) return []

  const delimiter = detectDelimiter(lines[0])
  const header = splitCsvLine(lines[0], delimiter).map((cell) => cell.toLowerCase())

  /** Index de la première colonne trouvée parmi des alias (-1 si absente). */
  const col = (...names: string[]): number => {
    for (const name of names) {
      const i = header.indexOf(name)
      if (i !== -1) return i
    }
    return -1
  }

  const idx = {
    ordre: col('ordre'),
    adresse: col('adresse'),
    lat: col('lat', 'latitude'),
    lng: col('lng', 'longitude'),
    type: col('type'),
    statut: col('statut', 'status'),
  }

  const cellAt = (cells: string[], i: number): string | undefined =>
    i === -1 ? undefined : cells[i]

  return lines
    .slice(1)
    .map((line, i): Stop => {
      const cells = splitCsvLine(line, delimiter)
      return {
        ordre: Number(cellAt(cells, idx.ordre)) || i + 1,
        adresse: cellAt(cells, idx.adresse) ?? '',
        lat: Number(cellAt(cells, idx.lat)),
        lng: Number(cellAt(cells, idx.lng)),
        type: cellAt(cells, idx.type) ?? '',
        status: normalizeStatus(cellAt(cells, idx.statut)),
        distanceMeters: null,
        etaMinutes: null,
        completedAt: null,
      }
    })
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
    .sort((a, b) => a.ordre - b.ordre)
}

export async function loadDemoMission(): Promise<Mission> {
  const response = await fetch(DEMO_CSV_PATH)
  if (!response.ok) {
    throw new Error(`Impossible de charger la tournée de démonstration (${response.status}).`)
  }
  const csv = await response.text()
  return {
    ...DEMO_MISSION_META,
    stops: parseStops(csv),
  }
}
