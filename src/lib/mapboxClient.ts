export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export const isMapboxConfigured = Boolean(MAPBOX_TOKEN)
