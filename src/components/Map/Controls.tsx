"use client";

import { MAPBOX_STYLES } from '@/constants/map';

interface ControlsProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export default function Controls({ currentStyle, onStyleChange }: ControlsProps) {
  const options = [
    {
      id: MAPBOX_STYLES.OUTDOOR,
      label: 'Plan',
      preview: 'bg-emerald-100 border-emerald-200' 
    },
    {
      id: MAPBOX_STYLES.SATELLITE,
      label: 'Sat.',
      preview: 'bg-slate-800 border-slate-700'
    }
  ];

  return (
    <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl shadow-sm pointer-events-auto">
      {options.map((option) => {
        const isActive = currentStyle === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onStyleChange(option.id)}
            className={`group relative h-10 w-10 rounded-xl transition-all duration-300 border overflow-hidden ${
              isActive 
                ? 'border-blue-500 shadow-sm' 
                : 'border-transparent hover:border-slate-200'
            }`}
          >
            {/* Aperçu visuel */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${option.preview} ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
            
            {/* Label discret */}
            <div className="absolute inset-x-0 bottom-0 bg-black/30 py-0.5">
              <span className={`block text-[7px] text-center text-white/90 ${
                isActive ? 'font-medium' : 'font-normal'
              }`}>
                {option.label}
              </span>
            </div>

            {/* Indicateur minimaliste (petit point blanc) */}
            {isActive && (
              <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}