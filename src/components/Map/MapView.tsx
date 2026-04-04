"use client";

import { useState, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_STYLES, DEFAULT_MAP_CONFIG } from '@/constants/map';
import { ROUTE_LAYER_STYLE } from '@/constants/layers';
import MapOverlay from '@/components/Map/MapOverlay';

export default function MapView() {
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.OUTDOOR);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
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

  const tracksList = geoData?.features?.map((f: any) => ({
    id: f.properties.id,
    name: f.properties.name,
    type: f.properties.type
  })) || [];

  return (
    <div className="relative h-full w-full">
      <MapOverlay 
        currentStyle={currentStyle}
        onStyleChange={setCurrentStyle}
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
        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            <Layer 
              {...ROUTE_LAYER_STYLE} 
              filter={selectedRouteId ? ['==', ['get', 'id'], selectedRouteId] : ['all']} 
            />
          </Source>
        )}
      </Map>
    </div>
  );
}