"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { point } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';

import { MAPBOX_STYLES, DEFAULT_MAP_CONFIG } from '@/constants/map';
import { getTrackColor } from '@/constants/colors';
import { ROUTE_LAYER_BASE_PAINT, ROUTE_LAYER_LAYOUT } from '@/constants/layers';
import MapOverlay from '@/components/Map/MapOverlay';
import lineSlice from '@turf/line-slice';
import length from '@turf/length';

export default function MapView() {
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.OUTDOOR);
  const isSatelliteMode = currentStyle === MAPBOX_STYLES.SATELLITE;
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  
  // État pour le point qui suit la souris (Altitude)
  const [hoverInfo, setHoverInfo] = useState<{
    lng: number;
    lat: number;
    alt: number;
    dist: string;
    x: number;
    y: number;
  } | null>(null);

  const [viewState, setViewState] = useState({
    ...DEFAULT_MAP_CONFIG,
    pitch: 0,
    bearing: 0
  });

  // --- LOGIQUE DE TRI ET COULEURS ---
  const tracksWithColors = useMemo(() => {
    if (!geoData?.features) return [];

    // 1. Tri numérique (7, 11, 15, 20...)
    const sortedFeatures = [...geoData.features].sort((a, b) => {
      const typeComp = a.properties.type.localeCompare(b.properties.type);
      if (typeComp !== 0) return typeComp;
      return a.properties.name.localeCompare(b.properties.name, undefined, { numeric: true });
    });

    // 2. Attribution des couleurs par type
    const typeIndices: Record<string, number> = {};
    return sortedFeatures.map((f: any) => {
      const type = f.properties.type.toLowerCase();
      const idx = typeIndices[type] ?? 0;
      typeIndices[type] = idx + 1;

      return {
        id: f.properties.id,
        name: f.properties.name,
        type: type,
        color: getTrackColor(type, idx, isSatelliteMode)
      };
    });
  }, [geoData, isSatelliteMode]);

  // Générateur d'expression pour le Layer
  const getColorExpression = () => {
    if (tracksWithColors.length === 0) return '#3b82f6';
    const expression: any[] = ['match', ['get', 'id']];
    tracksWithColors.forEach(t => {
      expression.push(t.id, t.color);
    });
    expression.push('#3b82f6');
    return expression as any;
  };

  // --- LOGIQUE DU CURSEUR (TURF) ---
  const handleMouseMove = useCallback((event: any) => {
    const feature = event.features && event.features[0];
    
    if (feature && geoData) {
      const mousePt = point([event.lngLat.lng, event.lngLat.lat]);
      const activeRoute = geoData.features.find((f: any) => f.properties.id === feature.properties.id);

      if (activeRoute) {
        // 1. On "aimante" toujours la souris sur la ligne
        const snapped = nearestPointOnLine(activeRoute, mousePt);
        
        // 2. On récupère l'index du point le plus proche sur le tracé original
        const closestIndex = snapped.properties?.index || 0;
        
        // 3. On extrait les données pré-calculées [lng, lat, alt, dist]
        const pointData = activeRoute.geometry.coordinates[closestIndex];

        if (pointData) {
          setHoverInfo({
            lng: snapped.geometry.coordinates[0],
            lat: snapped.geometry.coordinates[1],
            alt: Math.round(pointData[2] || 0),   // Index 2 : Altitude
            dist: pointData[3]?.toFixed(1) || "0.0", // Index 3 : Distance pré-calculée !
            x: event.point.x,
            y: event.point.y
          });
        }
      }
    } else {
      setHoverInfo(null);
    }
  }, [geoData]);

  useEffect(() => {
    fetch('/data/tracks.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="relative h-full w-full group">
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
        onMouseMove={handleMouseMove}
        onClick={() => setSelectedRouteId(null)}
        // On écoute maintenant sur le calque invisible (plus large)
        interactiveLayerIds={['route-hover-helper']} 
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={currentStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" visualizePitch />

        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            {/* CALQUE FANTÔME (La Hitbox) */}
            <Layer 
              id="route-hover-helper"
              type="line"
              paint={{
                'line-width': 12,       // Voici ta hitbox : 30px de large !
                'line-color': 'rgba(0, 0, 0, 0)', // Totalement invisible
              }}
              layout={ROUTE_LAYER_LAYOUT}
            />

            {/* CALQUE VISIBLE (Tes sentiers) */}
            <Layer 
              id="route-layer"
              type="line"
              layout={ROUTE_LAYER_LAYOUT}
              paint={{
                ...ROUTE_LAYER_BASE_PAINT,
                'line-width': selectedRouteId ? 7 : 4,
                'line-color': getColorExpression(),
                'line-opacity': selectedRouteId ? 1 : 0.8
              }}
              filter={selectedRouteId ? ['==', ['get', 'id'], selectedRouteId] : ['all']}
            />
          </Source>
        )}

        {/* REAJOUTE CE BLOC ICI : Le point blanc aimanté */}
        {hoverInfo && (
          <Source id="hover-pt" type="geojson" data={{
            type: 'Feature',
            geometry: { 
              type: 'Point', 
              coordinates: [hoverInfo.lng, hoverInfo.lat] 
            },
            properties: {}
          }}>
            <Layer 
              id="hover-circle" 
              type="circle" 
              paint={{
                'circle-radius': 6,
                'circle-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000',
              }} 
            />
          </Source>
        )}

        {/* Le petit point blanc aimanté */}
        {hoverInfo && (
          <div 
            className="absolute pointer-events-none bg-slate-900/95 text-white px-3 py-2 rounded-lg shadow-2xl text-[11px] font-medium flex flex-col gap-1 border border-white/10 backdrop-blur-sm"
            style={{ 
              left: hoverInfo.x + 25, // Augmenté à 25
              top: hoverInfo.y - 40   // Remonté à -40 pour ne pas gêner la lecture du tracé
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 uppercase text-[9px] font-black tracking-tighter">Distance</span>
              <span className="font-mono text-blue-400">{hoverInfo.dist} km</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1">
              <span className="text-slate-400 uppercase text-[9px] font-black tracking-tighter">Altitude</span>
              <span className="font-mono text-emerald-400">{hoverInfo.alt} m</span>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}