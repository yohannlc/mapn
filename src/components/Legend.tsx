"use client";

interface Track {
  id: string;
  name: string;
  type: 'vtt' | 'marche';
}

interface LegendProps {
  tracks: Track[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function Legend({ tracks, selectedId, onSelect }: LegendProps) {
  return (
    <div className="absolute left-4 top-40 z-10 flex w-64 flex-col gap-2 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md border border-white/20">
      <h3 className="text-sm font-bold text-gray-900">Circuits</h3>
      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={(e) => {
              e.stopPropagation(); // Évite de trigger le clic sur la carte
              onSelect(track.id);
            }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
              selectedId === track.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${track.type === 'vtt' ? 'bg-orange-500' : 'bg-green-500'}`} />
            {track.name}
          </button>
        ))}
      </div>
      <p className="text-[9px] text-gray-400 mt-1 italic italic">
        Clique sur la carte pour tout afficher
      </p>
    </div>
  );
}