"use client";

import { useState, useEffect } from 'react';
import Map, { Source, Layer, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_STYLES, DEFAULT_MAP_CONFIG } from '@/constants/map';
import MapControls from '@/components/Controls';
import Legend from '@/components/Legend';

export default function MapView() {
  // Correction 2 : On précise <string>
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.OUTDOOR);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  
  // Correction 1 : On précise <any> ou un type GeoJSON
  const [geoData, setGeoData] = useState<any>(null);

  const [viewState, setViewState] = useState({
    longitude: DEFAULT_MAP_CONFIG.longitude,
    latitude: DEFAULT_MAP_CONFIG.latitude,
    zoom: DEFAULT_MAP_CONFIG.zoom
  });

  useEffect(() => {
    fetch('/data/tracks.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Erreur chargement JSON:", err));
  }, []);

  // Extraction sécurisée des données pour la légende
  const tracksList = geoData?.features?.map((f: any) => ({
    id: f.properties.id,
    name: f.properties.name,
    type: f.properties.type
  })) || [];

  return (
    <div className="relative h-full w-full">
      <MapControls 
        currentStyle={currentStyle} 
        onStyleChange={setCurrentStyle} 
      />
      
      <Legend 
        tracks={tracksList} 
        selectedId={selectedRouteId} 
        onSelect={setSelectedRouteId} 
      />

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={() => setSelectedRouteId(null)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={currentStyle}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        {/* Correction 3 : La hiérarchie Source > Layer */}
        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-width': 4,
                'line-color': [
                  'match', 
                  ['get', 'type'], 
                  'vtt', '#f97316', 
                  'marche', '#22c55e', 
                  '#3b82f6'
                ],
                'line-opacity': 0.8
              }}
              // Version ultra-robuste : 
              // Si selectedRouteId est défini, on filtre sur l'ID.
              // Sinon, on utilise une expression qui renvoie toujours "vrai" (1 == 1)
              filter={selectedRouteId 
                ? ['==', ['get', 'id'], selectedRouteId] 
                : ['all'] // ['all'] sans arguments supplémentaires affiche tout dans Mapbox
              }
            />
          </Source>
        )}
      </Map>
    </div>
  );
}