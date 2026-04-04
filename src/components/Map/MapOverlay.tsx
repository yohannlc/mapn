"use client";

import Controls from '@/components/Map/Controls';
import Legend from '@/components/Map/Legend';

interface OverlayProps {
  currentStyle: string;
  onStyleChange: (s: string) => void;
  tracks: any[];
  selectedId: string | null;
  // Ajout du "| null" pour permettre de désélectionner un circuit
  onSelect: (id: string | null) => void;
}

export default function MapOverlay({
  currentStyle,
  onStyleChange,
  tracks,
  selectedId,
  onSelect
}: OverlayProps) {
  return (
    <div className="absolute left-6 top-6 z-10 flex flex-col gap-4 items-start pointer-events-none">
      
      {/* Bloc de la légende (Circuits) en premier */}
      <div className="pointer-events-auto">
        <Legend 
          tracks={tracks} 
          selectedId={selectedId} 
          onSelect={onSelect} 
        />
      </div>

      {/* Bloc des réglages (Fond de carte) en dessous */}
      <div className="pointer-events-auto">
        <Controls 
          currentStyle={currentStyle} 
          onStyleChange={onStyleChange} 
        />
      </div>

    </div>
  );
}