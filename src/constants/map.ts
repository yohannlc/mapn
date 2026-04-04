export const MAPBOX_STYLES = {
  OUTDOOR: 'mapbox://styles/yohannlc/cm8hbqqxj003t01s57dlx3iya',
  SATELLITE: 'mapbox://styles/yohannlc/cm8hha9d9002301s89a41db9x',
} as const;

export const DEFAULT_MAP_CONFIG = {
  longitude: -3.72794317895395,
  latitude: 48.17354630561118,
  zoom: 12,
}

// --- CONFIGURATION DES TRACÉS (LIGNES) ---

export const TRACK_CONFIG = {
  // Épaisseur des lignes
  WIDTH_DEFAULT: 5,
  WIDTH_SELECTED: 7,
  
  // Épaisseur de la hitbox (zone de détection invisible)
  HITBOX_DEFAULT: 20,
  HITBOX_SELECTED: 40,
  
  // Opacité
  OPACITY_DEFAULT: 0.8,
  OPACITY_SELECTED: 1,
  
  // Rayon du point blanc d'altitude
  HOVER_DOT_RADIUS: 6,
};

// Filtres de base pour les layers
export const LAYER_FILTERS = {
  ID_MATCH: (id: string | null) => id ? ['==', ['get', 'id'], id] : ['all'],
};