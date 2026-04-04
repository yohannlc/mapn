"use client";

import { MAPBOX_STYLES } from '@/constants/map';

interface ControlsProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export default function Controls({ currentStyle, onStyleChange }: ControlsProps) {
  
  const isSatellite = currentStyle === MAPBOX_STYLES.SATELLITE;

  const toggleStyle = () => {
    onStyleChange(isSatellite ? MAPBOX_STYLES.OUTDOOR : MAPBOX_STYLES.SATELLITE);
  };

  return (
    <div className="flex w-64 flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md border border-white/20">
      <div className="flex items-center justify-between bg-gray-100/50 p-2 rounded-xl">
        <span className="text-xs font-medium text-gray-700">
          {isSatellite ? 'Vue Satellite' : 'Vue Outdoor'}
        </span>
        
        <button
          onClick={toggleStyle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
            isSatellite ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              isSatellite ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}