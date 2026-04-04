// src/constants/layers.ts
import { CIRCUIT_TYPES_CONFIG, CircuitType } from './map';

// On génère dynamiquement le tableau de correspondance pour Mapbox
// Format attendu : ['match', ['get', 'type'], 'vtt', '#f97316', 'trail', '#ec4899', ..., 'defaultColor']
const getColorExpression = () => {
  const expression: any[] = ['match', ['get', 'type']];
  
  (Object.keys(CIRCUIT_TYPES_CONFIG) as CircuitType[]).forEach((type) => {
    expression.push(type);
    expression.push(CIRCUIT_TYPES_CONFIG[type].color);
  });

  expression.push('#cccccc'); // Couleur par défaut si type inconnu
  return expression;
};

export const ROUTE_LAYER_STYLE: any = {
  id: 'route-layer',
  type: 'line',
  paint: {
    'line-width': 4,
    'line-color': getColorExpression(),
    'line-opacity': 0.8,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
};