"use client";

import Controls from '@/components/Map/Controls';
import Legend from '@/components/Map/Legend';

interface OverlayProps {
  currentStyle: string;
  onStyleChange: (s: string) => void;
  tracks: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapOverlay(props: OverlayProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col gap-3 w-72 pointer-events-none">
      
      <div className="pointer-events-auto">
        <Legend 
          tracks={props.tracks} 
          selectedId={props.selectedId} 
          onSelect={props.onSelect} 
        />
      </div>

      <div className="pointer-events-auto">
        <Controls 
          currentStyle={props.currentStyle} 
          onStyleChange={props.onStyleChange} 
        />
      </div>

    </div>
  );
}