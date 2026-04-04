import type { LineLayerSpecification } from 'mapbox-gl';

export const ROUTE_LAYER_STYLE: LineLayerSpecification = {
  id: 'route-layer',
  type: 'line',
  paint: {
    'line-width': 4,
    'line-color': [
      'match',
      ['get', 'type'],
      'vtt', '#5f4a4a',    // Orange
      'marche', '#22c55e', // Vert
      '#3b82f6'            // Bleu par défaut
    ],
    'line-opacity': 0.8
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  }
} as any;