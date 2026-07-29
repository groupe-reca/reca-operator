import type { LngLatBoundsLike } from 'mapbox-gl'

/** Bounding box englobant une liste de points [lng, lat] — pour `map.fitBounds()`. */
export function boundsFromPoints(points: [number, number][]): LngLatBoundsLike | null {
  if (points.length === 0) return null

  let minLng = points[0][0]
  let maxLng = points[0][0]
  let minLat = points[0][1]
  let maxLat = points[0][1]

  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}
