"use client";

import { useMemo } from 'react';
import { CIRCUIT_SETTINGS, CircuitType } from '@/constants/layers';

interface Track {
  id: string;
  name: string;
  type: string;
  color: string;
  elevationGain?: number;
}

interface LegendProps {
  tracks: Track[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function Legend({ tracks, selectedId, onSelect }: LegendProps) {
  const groupedTracks = useMemo(() => {
    return tracks.reduce((acc, track) => {
      const type = track.type || 'Autre';
      if (!acc[type]) acc[type] = [];
      acc[type].push(track);
      return acc;
    }, {} as Record<string, Track[]>);
  }, [tracks]);

  const types = Object.keys(groupedTracks).sort();

  return (
    <div className="w-fit flex flex-col rounded-2xl bg-white/80 p-2.5 shadow-xl backdrop-blur-md border border-white/20 pointer-events-auto text-slate-800">
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto p-1 scrollbar-thin">
        {tracks.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic text-center py-2 px-4">Aucun tracé</p>
        ) : (
          types.map((type) => (
            <div key={type} className="flex flex-col">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-200/40 pb-0.5 mb-1">
                {CIRCUIT_SETTINGS[type as CircuitType]?.label || type}
              </h4>
              
              <div className="flex flex-col">
                {groupedTracks[type].map((track) => {
                  const isSelected = selectedId === track.id;
                  
                  return (
                    <button
                      key={track.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(isSelected ? null : track.id);
                      }}
                      className={`group flex items-center gap-3 py-0.5 px-1 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-white shadow-sm ring-1 ring-slate-200/50' 
                          : 'hover:bg-white/40'
                      }`}
                    >
                      {/* Point de couleur */}
                      <div 
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />

                      {/* Contenu aligné : Nom | D+ */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className={`text-[12px] whitespace-nowrap transition-all ${
                          isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                        }`}>
                          {track.name}
                        </span>
                        
                        {track.elevationGain !== undefined && (
                          <div className="flex items-center gap-0.5 shrink-0 text-[10px] font-bold text-slate-400 tracking-tight">
                            <span className={`text-[7px] ${isSelected ? 'text-emerald-500' : ''}`}>▲</span>
                            <span className={isSelected ? 'text-slate-700' : ''}>
                              {track.elevationGain}m
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}