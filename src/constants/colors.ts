export const PREDEFINED_COLORS: Record<string, { darker: string[]; lighter: string[] }> = {
  vtt: {
    darker: [
      '#009924',
      '#06a7c7',
      '#ffe400',
      '#c45ebd',
      '#ff0000',
      '#000000',
    ],
    lighter: [
      '#31d76b',
      '#06a7c7',
      '#ffe400',
      '#c45ebd',
      '#ff0000',
      '#ffffff',
    ]
  },
  marche: {
    darker: [
      '#3a2cbd',
      '#ae45ff',
      '#ec794b',
    ],
    lighter: [
      '#3a2cbd', 
      '#ae45ff',
      '#ec794b',
    ]
  }
};

export const getTrackColor = (type: string, index: number, isSatellite: boolean) => {
  const mode = isSatellite ? 'lighter' : 'darker';
  const palette = PREDEFINED_COLORS[type.toLowerCase()]?.[mode];

  // Ajout du modulo (%) pour boucler sur la palette
  if (palette && palette.length > 0) {
    return palette[index % palette.length];
  }

  const hue = (index * 137.5) % 360;
  return `hsl(${hue}, 80%, ${isSatellite ? '70%' : '50%'})`;
};