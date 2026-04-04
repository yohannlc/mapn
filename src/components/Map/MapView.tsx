"use client";

import { useState, useEffect, useMemo } from 'react';
// Ajout de NavigationControl ici
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_STYLES, DEFAULT_MAP_CONFIG } from '@/constants/map';
import { getTrackColor } from '@/utils/colors';
import MapOverlay from '@/components/Map/MapOverlay';

export default function MapView() {
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.OUTDOOR);
  const isSatelliteMode = currentStyle === MAPBOX_STYLES.SATELLITE;
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  const [viewState, setViewState] = useState({
    longitude: DEFAULT_MAP_CONFIG.longitude,
    latitude: DEFAULT_MAP_CONFIG.latitude,
    zoom: DEFAULT_MAP_CONFIG.zoom,
    // On ajoute pitch et bearing pour que la boussole fonctionne pleinement
    pitch: 0,
    bearing: 0
  });

  const tracksWithColors = useMemo(() => {
    return geoData?.features?.map((f: any, index: number) => ({
      id: f.properties.id,
      name: f.properties.name,
      type: f.properties.type,
      color: getTrackColor(f.properties.type, index, isSatelliteMode)
    })) || [];
  }, [geoData, isSatelliteMode]);

  const getColorExpression = () => {
    if (tracksWithColors.length === 0) return '#3b82f6';
    const expression: any[] = ['match', ['get', 'id']]; 
    tracksWithColors.forEach((t: any) => {
      expression.push(t.id);
      expression.push(t.color);
    });
    expression.push('#3b82f6'); 
    return expression as any;
  };

  useEffect(() => {
    fetch('/data/tracks.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Erreur chargement JSON:", err));
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapOverlay 
        currentStyle={currentStyle}
        onStyleChange={setCurrentStyle}
        tracks={tracksWithColors}
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
        {/* BOUTONS ZOOM ET BOUSSOLE */}
        <NavigationControl 
          position="top-right" 
          visualizePitch={true} 
          showZoom={true} 
          showCompass={true} 
        />

        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            <Layer 
              id="route-layer"
              type="line"
              paint={{
                // Si un circuit est sélectionné, on peut épaissir un peu la ligne
                'line-width': selectedRouteId ? 6 : 4,
                'line-color': getColorExpression(),
                // On baisse l'opacité globale pour que ce soit moins agressif
                'line-opacity': 0.8
              }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              // Ton filtre actuel est parfait : il cache les autres si un est sélectionné
              filter={selectedRouteId ? ['==', ['get', 'id'], selectedRouteId] : ['all']}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}