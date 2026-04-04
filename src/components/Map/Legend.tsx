"use client";

import { useMemo } from 'react';

interface Track {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface LegendProps {
  tracks: Track[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function Legend({ tracks, selectedId, onSelect }: LegendProps) {
  // Regroupement par type
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
    <div className="w-full flex flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md border border-white/20 pointer-events-auto text-slate-800">
      <div className="flex flex-col gap-5 max-h-80 overflow-y-auto pr-1">
        {tracks.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic text-center py-2">Chargement...</p>
        ) : (
          types.map((type) => (
            <div key={type} className="flex flex-col gap-1.5">
              {/* Titre de catégorie très discret */}
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-200/50 pb-1 mb-1">
                {type}
              </h4>
              
              <div className="flex flex-col">
                {groupedTracks[type].map((track) => {
                  const isSelected = selectedId === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        // On bascule entre sélection et dé-sélection au clic
                        onSelect(isSelected ? null : track.id);
                      }}
                      className="group flex items-center gap-3 py-1 px-1 transition-colors"
                    >
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className={`text-xs truncate w-full text-left transition-all ${
                        isSelected 
                          ? 'font-black text-slate-900' 
                          : 'font-medium text-slate-500 hover:text-slate-700'
                      }`}>
                        {track.name}
                      </span>
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