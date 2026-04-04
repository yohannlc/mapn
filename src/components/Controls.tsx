"use client";

import { MAPBOX_STYLES } from '@/constants/map';

interface MapControlsProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export default function MapControls({ currentStyle, onStyleChange }: MapControlsProps) {
  
  const isSatellite = currentStyle === MAPBOX_STYLES.SATELLITE;

  const toggleStyle = () => {
    onStyleChange(isSatellite ? MAPBOX_STYLES.OUTDOOR : MAPBOX_STYLES.SATELLITE);
  };

  return (
    <div className="absolute left-4 top-4 z-10 flex w-64 flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md border border-white/20">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-gray-900">Configuration</h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Fond de carte</p>
      </div>

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

      {/* Emplacement futur pour d'autres réglages (on va ajouter beaucoup de choses ici) */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 italic italic">Plus d'options à venir...</p>
      </div>
    </div>
  );
}