export const ROUTE_LAYER_BASE_PAINT = {
  'line-width': 4,
  'line-opacity': 0.8,
};

export const ROUTE_LAYER_LAYOUT = {
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

export type CircuitType = 'vtt' | 'trail' | 'marche' | 'cyclo';

export const CIRCUIT_LABELS: Record<CircuitType, string> = {
  vtt: 'VTT',
  trail: 'Trail',
  marche: 'Marche',
  cyclo: 'Cyclo',
};