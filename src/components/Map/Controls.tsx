"use client";

import { MAP_STYLE_OPTIONS } from '@/constants/map';
import { CIRCUIT_SETTINGS, CircuitType } from '@/constants/layers';

interface ControlsProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
  visibleTypes: string[];
  onToggleType: (type: string) => void;
}

export default function Controls({ currentStyle, onStyleChange, visibleTypes, onToggleType }: ControlsProps) {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      {/* Styles de carte */}
      <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl shadow-sm">
        {MAP_STYLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onStyleChange(option.id)}
            className={`group relative h-10 w-10 rounded-xl transition-all border overflow-hidden ${
              currentStyle === option.id ? 'border-blue-500 shadow-sm' : 'border-transparent hover:border-slate-200'
            }`}
          >
            <div className={`absolute inset-0 ${option.preview} ${currentStyle === option.id ? 'opacity-100' : 'opacity-70'}`} />
            <div className="absolute inset-x-0 bottom-0 bg-black/30 py-0.5 text-[7px] text-white uppercase text-center font-medium">
              {option.label}
            </div>
          </button>
        ))}
      </div>

      {/* Types de circuits */}
      <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl shadow-sm">
        {(Object.keys(CIRCUIT_SETTINGS) as CircuitType[]).map((type) => {
          const isVisible = visibleTypes.includes(type);
          const config = CIRCUIT_SETTINGS[type];
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`group relative h-10 w-10 rounded-xl transition-all border flex flex-col items-center justify-center ${
                isVisible 
                  ? 'bg-white border-slate-200 shadow-sm' 
                  : 'bg-slate-100/50 border-transparent grayscale opacity-50'
              }`}
            >
              <span className="text-sm">{config.icon}</span>
              <span className={`text-[7px] uppercase font-bold ${isVisible ? 'text-blue-600' : 'text-slate-400'}`}>
                {config.label}
              </span>
              {/* Pastille bleue supprimée ici */}
            </button>
          );
        })}
      </div>
    </div>
  );
}