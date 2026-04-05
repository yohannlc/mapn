"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { point } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';

import { MAPBOX_STYLES, DEFAULT_MAP_CONFIG } from '@/constants/map';
import { getTrackColor } from '@/constants/colors';
import { ROUTE_LAYER_LAYOUT } from '@/constants/layers';
import MapOverlay from '@/components/Map/MapOverlay';
import { TRACK_CONFIG, LAYER_FILTERS } from '@/constants/map';

export default function MapView() {
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.OUTDOOR);
  const isSatelliteMode = currentStyle === MAPBOX_STYLES.SATELLITE;
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['vtt', 'marche']);

  const toggleType = (type: string) => {
    setVisibleTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };
  
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

  const getCombinedFilter = () => {
    const typeFilter = ['in', ['get', 'type'], ['literal', visibleTypes]];
    
    if (selectedRouteId) {
      return ['all', typeFilter, ['==', ['get', 'id'], selectedRouteId]];
    }
    return typeFilter;
  };

  // --- LOGIQUE DE TRI ET COULEURS ---
  const tracksWithColors = useMemo(() => {
    if (!geoData?.features) return [];

    const sortedFeatures = [...geoData.features].sort((a, b) => {
      const typeComp = a.properties.type.localeCompare(b.properties.type);
      if (typeComp !== 0) return typeComp;
      return a.properties.name.localeCompare(b.properties.name, undefined, { numeric: true });
    });

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

  const getColorExpression = () => {
    if (tracksWithColors.length === 0) return '#3b82f6';
    const expression: any[] = ['match', ['get', 'id']];
    tracksWithColors.forEach(t => {
      expression.push(t.id, t.color);
    });
    expression.push('#3b82f6');
    return expression as any;
  };

  // --- LOGIQUE DU CURSEUR (LÉGÈRE & OPTIMISÉE) ---
  const handleMouseMove = useCallback((event: any) => {
    let feature = event.features && event.features[0];

    if (selectedRouteId && feature && feature.properties.id !== selectedRouteId) {
      feature = null;
    }
    
    if (feature && geoData) {
      const mousePt = point([event.lngLat.lng, event.lngLat.lat]);
      const activeRoute = geoData.features.find((f: any) => f.properties.id === feature.properties.id);

      if (activeRoute) {
        const snapped = nearestPointOnLine(activeRoute, mousePt);
        const closestIndex = snapped.properties?.index || 0;
        const pointData = activeRoute.geometry.coordinates[closestIndex];

        if (pointData) {
          setHoverInfo({
            lng: snapped.geometry.coordinates[0],
            lat: snapped.geometry.coordinates[1],
            alt: Math.round(pointData[2] || 0),
            dist: pointData[3]?.toFixed(1) || "0.0",
            x: event.point.x,
            y: event.point.y
          });
        }
      }
    } else {
      setHoverInfo(null);
    }
  }, [geoData, selectedRouteId]);

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
        visibleTypes={visibleTypes}
        onToggleType={toggleType}
      />

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMouseMove={handleMouseMove}
        onClick={() => setSelectedRouteId(null)}
        interactiveLayerIds={['route-hover-helper']} 
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={currentStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" visualizePitch />

        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            {/* HITBOX INVISIBLE POUR FACILITER LE SURVOL */}
            <Layer 
              id="route-hover-helper"
              type="line"
              paint={{
                'line-width': selectedRouteId 
                  ? TRACK_CONFIG.HITBOX_SELECTED 
                  : TRACK_CONFIG.HITBOX_DEFAULT,
                'line-color': 'rgba(0, 0, 0, 0)',
              }}
              layout={ROUTE_LAYER_LAYOUT}
              filter={getCombinedFilter()}
            />

            {/* TRACÉS VISIBLES (L'offset est déjà dans les coordonnées) */}
            <Layer 
              id="route-layer"
              type="line"
              layout={{
                ...ROUTE_LAYER_LAYOUT,
                // Note : join et cap sont déjà dans ROUTE_LAYER_LAYOUT normalement, 
                // mais on les laisse ici par sécurité si tu préfères
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                // On a supprimé ...ROUTE_LAYER_BASE_PAINT ici
                'line-width': selectedRouteId 
                  ? TRACK_CONFIG.WIDTH_SELECTED 
                  : TRACK_CONFIG.WIDTH_DEFAULT,
                
                'line-color': getColorExpression(),
                
                'line-opacity': selectedRouteId 
                  ? TRACK_CONFIG.OPACITY_SELECTED 
                  : TRACK_CONFIG.OPACITY_DEFAULT,
                  
                // Optionnel : tu peux ajouter un lissage visuel ici si besoin
                'line-blur': 0.5 
              }}
              filter={getCombinedFilter()}
            />
          </Source>
        )}

        {/* POINT BLANC AIMANTÉ */}
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
                'circle-radius': TRACK_CONFIG.HOVER_DOT_RADIUS,
                'circle-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000',
              }} 
            />
          </Source>
        )}

        {/* BULLE D'INFORMATIONS */}
        {hoverInfo && (
          <div 
            className="absolute pointer-events-none bg-slate-900/95 text-white px-3 py-2 rounded-lg shadow-2xl text-[11px] font-medium flex flex-col gap-1 border border-white/10 backdrop-blur-sm z-50"
            style={{ 
              left: hoverInfo.x + 25,
              top: hoverInfo.y - 40
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