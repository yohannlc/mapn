// src/constants/colors.ts

export const PREDEFINED_COLORS: Record<string, { darker: string[]; lighter: string[] }> = {
  vtt: {
    darker: ['#307127', '#ea580c', '#000000'],
    lighter:  ['#00ff11', '#fdba74', '#000000'],
  },
  trail: {
    darker: ['#ec4899', '#be185d'],
    lighter:  ['#f472b6', '#f9a8d4'],
  },
  // ... etc
};

export const getTrackColor = (type: string, index: number, isSatellite: boolean) => {
  const mode = isSatellite ? 'lighter' : 'darker';
  const palette = PREDEFINED_COLORS[type.toLowerCase()]?.[mode];

  if (palette && palette[index]) {
    return palette[index];
  }

  // Fallback dynamique : on ajuste la luminosité selon le mode
  const hue = (index * 137.5) % 360; // Nombre d'or pour une meilleure répartition
  const lightness = isSatellite ? '70%' : '50%'; 
  return `hsl(${hue}, 80%, ${lightness})`;
};