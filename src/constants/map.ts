export const MAPBOX_STYLES = {
  OUTDOOR: 'mapbox://styles/yohannlc/cm8hbqqxj003t01s57dlx3iya',
  SATELLITE: 'mapbox://styles/yohannlc/cm8hha9d9002301s89a41db9x',
} as const;

export const DEFAULT_MAP_CONFIG = {
  longitude: -3.72794317895395,
  latitude: 48.17354630561118,
  zoom: 12,
}

export type CircuitType = 'vtt' | 'trail' | 'marche' | 'cyclo';

export interface CircuitConfig {
  label: string;
  color: string;
}

export const CIRCUIT_TYPES_CONFIG: Record<CircuitType, CircuitConfig> = {
  vtt: { label: 'VTT', color: '#5a16f9' },    // Orange
  trail: { label: 'Trail', color: '#ec4899' }, // Rose
  marche: { label: 'Marche', color: '#22c55e' }, // Vert
  cyclo: { label: 'Cyclo', color: '#3b82f6' },   // Bleu
};