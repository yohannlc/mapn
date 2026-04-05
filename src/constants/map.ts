export const MAPBOX_STYLES = {
  OUTDOOR: 'mapbox://styles/yohannlc/cm8hbqqxj003t01s57dlx3iya',
  SATELLITE: 'mapbox://styles/yohannlc/cm8hha9d9002301s89a41db9x',
} as const;

export const DEFAULT_MAP_CONFIG = {
  longitude: -3.72794317895395,
  latitude: 48.17354630561118,
  zoom: 12,
};

export const MAP_STYLE_OPTIONS = [
  { id: MAPBOX_STYLES.OUTDOOR, label: 'Out.', preview: 'bg-emerald-100 border-emerald-200' },
  { id: MAPBOX_STYLES.SATELLITE, label: 'Sat.', preview: 'bg-slate-800 border-slate-700' }
];

export const TRACK_CONFIG = {
  WIDTH_DEFAULT: 5,
  WIDTH_SELECTED: 7,
  HITBOX_DEFAULT: 20,
  HITBOX_SELECTED: 40,
  OPACITY_DEFAULT: 0.99,
  OPACITY_SELECTED: 1,
  HOVER_DOT_RADIUS: 6,
};

export const LAYER_FILTERS = {
  // Filtre combiné : ID spécifique ET types autorisés
  COMBINED: (id: string | null, visibleTypes: string[]) => {
    const typeFilter = ['in', ['get', 'type'], ['literal', visibleTypes]];
    if (id) return ['all', typeFilter, ['==', ['get', 'id'], id]];
    return typeFilter;
  }
};