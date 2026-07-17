import type { Mission, Stop } from '../domain/types'

/**
 * Chargement de la tournée de démonstration depuis un CSV statique
 * (`/public/demo/route.csv`). Source temporaire pour ce sprint : aucune base de
 * données permanente, aucune communication avec RECA App.
 *
 * Colonnes attendues : Ordre, Adresse, Latitude, Longitude, Type.
 */

const DEMO_CSV_PATH = '/demo/route.csv'

const DEMO_MISSION_META = {
  nom: 'Route 3 – Secteur Talon',
  secteur: 'Talon',
} as const

/** Découpe une ligne CSV simple (pas de virgules échappées dans nos données). */
function splitCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim())
}

function parseStops(csv: string): Stop[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length <= 1) return []

  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase())
  const idx = {
    ordre: header.indexOf('ordre'),
    adresse: header.indexOf('adresse'),
    latitude: header.indexOf('latitude'),
    longitude: header.indexOf('longitude'),
    type: header.indexOf('type'),
  }

  return lines
    .slice(1)
    .map((line, i): Stop => {
      const cells = splitCsvLine(line)
      return {
        ordre: Number(cells[idx.ordre]) || i + 1,
        adresse: cells[idx.adresse] ?? '',
        lat: Number(cells[idx.latitude]),
        lng: Number(cells[idx.longitude]),
        type: cells[idx.type] ?? '',
        status: 'EN_ATTENTE',
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
