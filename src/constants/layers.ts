export type CircuitType = 'vtt' | 'marche';

export interface CircuitConfig {
  label: string;
  icon: string;
  colorDefault?: string; // Le "?" rend la couleur optionnelle pour éviter l'erreur TS
}

export const CIRCUIT_SETTINGS: Record<CircuitType, CircuitConfig> = {
  vtt: { label: 'VTT', icon: '🚴' },
  marche: { label: 'Marche', icon: '🥾' },
};

export const ROUTE_LAYER_LAYOUT = {
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};