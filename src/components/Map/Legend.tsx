"use client";

import { CIRCUIT_TYPES_CONFIG, CircuitType } from '@/constants/map';

interface Track {
  id: string;
  name: string;
  type: string;
}

interface LegendProps {
  tracks: Track[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function Legend({ tracks, selectedId, onSelect }: LegendProps) {
  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md border border-white/20 pointer-events-auto text-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Circuits
        </h3>
        {selectedId && (
          <button 
            onClick={() => onSelect(null)}
            className="text-[10px] text-blue-600 hover:underline font-medium"
          >
            Tout voir
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {tracks.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">
            Aucun circuit chargé...
          </p>
        ) : (
          tracks.map((track) => {
            const config = CIRCUIT_TYPES_CONFIG[track.type as CircuitType] || { 
              label: 'Inconnu', 
              color: '#94a3b8' 
            };
            
            const isSelected = selectedId === track.id;

            return (
              <button
                key={track.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(isSelected ? null : track.id);
                }}
                className={`group flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-white border-slate-200 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-white/50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-inner shrink-0"
                  style={{ backgroundColor: config.color }}
                />

                <div className="flex flex-col items-start overflow-hidden">
                  <span className={`text-xs font-semibold truncate w-full text-left ${
                    isSelected ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {track.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {config.label}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2 italic">
        Clique sur la carte pour tout afficher
      </p>
    </div>
  );
}