const togeojson = require('@tmcw/togeojson');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const distance = require('@turf/distance').default;
const simplify = require('@turf/simplify').default;

const INPUT_DIR = './gpx';
const OUTPUT_FILE = './public/data/tracks.json';

// Espacement entre deux traces co-localisées (mètres)
const OFFSET_STEP = 5;

// Distance max (mètres) en dessous de laquelle deux points sont considérés
// sur le même segment → seuil de co-localisation
const COLOC_THRESHOLD_M = 15;

if (!fs.existsSync(INPUT_DIR)) {
  console.error(`❌ Le dossier ${INPUT_DIR} n'existe pas.`);
  process.exit(1);
}

// =============================================================================
// GÉOMÉTRIE DE BASE
// =============================================================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const MIN_DIST_SQ = 1e-10;

function bearingRad(from, to) {
  const dLon = to[0] - from[0];
  const dLat = to[1] - from[1];
  if (dLon * dLon + dLat * dLat < MIN_DIST_SQ) return null;
  const dLonRad = dLon * DEG_TO_RAD;
  const lat1 = from[1] * DEG_TO_RAD;
  const lat2 = to[1] * DEG_TO_RAD;
  const y = Math.sin(dLonRad) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLonRad);
  return Math.atan2(y, x);
}

function forwardBearing(coords, i) {
  for (let j = i + 1; j < coords.length; j++) {
    const b = bearingRad(coords[i], coords[j]);
    if (b !== null) return b;
  }
  return null;
}

function backwardBearing(coords, i) {
  for (let j = i - 1; j >= 0; j--) {
    const b = bearingRad(coords[j], coords[i]);
    if (b !== null) return b;
  }
  return null;
}

function destinationPoint(point, distanceMeters, bearing) {
  const R = 6371000;
  const delta = distanceMeters / R;
  const phi1 = point[1] * DEG_TO_RAD;
  const lambda1 = point[0] * DEG_TO_RAD;
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) +
    Math.cos(phi1) * Math.sin(delta) * Math.cos(bearing)
  );
  const lambda2 = lambda1 + Math.atan2(
    Math.sin(bearing) * Math.sin(delta) * Math.cos(phi1),
    Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
  );
  return [((lambda2 * RAD_TO_DEG) + 540) % 360 - 180, phi2 * RAD_TO_DEG];
}

function normalizeAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * Distance en mètres entre deux points [lon, lat] — approximation rapide
 * (équirectangulaire, précis à < 0.1% sur de courtes distances).
 */
function distMeters(a, b) {
  const R = 6371000;
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const dLon = (b[0] - a[0]) * DEG_TO_RAD;
  const mLat = ((a[1] + b[1]) / 2) * DEG_TO_RAD;
  return R * Math.sqrt(dLat * dLat + (Math.cos(mLat) * dLon) * (Math.cos(mLat) * dLon));
}

/**
 * Distance en mètres d'un point P au segment [A, B].
 */
function distPointToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq < MIN_DIST_SQ) return distMeters(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
  return distMeters(p, [a[0] + t * dx, a[1] + t * dy]);
}

// =============================================================================
// INDEX SPATIAL (grille régulière en degrés)
// =============================================================================

// ~0.001° ≈ 100m → cellule de ~100×100m, bonne granularité pour COLOC_THRESHOLD_M=15
const CELL_SIZE = 0.001;

class SpatialIndex {
  constructor() {
    this.grid = new Map(); // clé "ix,iy" → [{traceIdx, segIdx, a, b}]
  }

  _cellKey(ix, iy) { return `${ix},${iy}`; }

  _cellsForSegment(a, b) {
    // Toutes les cellules traversées par le segment (rasterisation simple)
    const x0 = Math.floor(Math.min(a[0], b[0]) / CELL_SIZE);
    const x1 = Math.floor(Math.max(a[0], b[0]) / CELL_SIZE);
    const y0 = Math.floor(Math.min(a[1], b[1]) / CELL_SIZE);
    const y1 = Math.floor(Math.max(a[1], b[1]) / CELL_SIZE);
    const cells = [];
    for (let ix = x0; ix <= x1; ix++)
      for (let iy = y0; iy <= y1; iy++)
        cells.push(this._cellKey(ix, iy));
    return cells;
  }

  addSegment(traceIdx, segIdx, a, b) {
    const entry = { traceIdx, segIdx, a, b };
    for (const key of this._cellsForSegment(a, b)) {
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key).push(entry);
    }
  }

  /**
   * Retourne tous les segments d'autres traces proches du segment [a,b].
   */
  nearbySegments(a, b, selfTraceIdx) {
    const seen = new Set();
    const results = [];
    for (const key of this._cellsForSegment(a, b)) {
      for (const entry of (this.grid.get(key) || [])) {
        if (entry.traceIdx === selfTraceIdx) continue;
        const uid = `${entry.traceIdx}-${entry.segIdx}`;
        if (seen.has(uid)) continue;
        seen.add(uid);
        results.push(entry);
      }
    }
    return results;
  }
}

// =============================================================================
// DÉTECTION DE CO-LOCALISATION
// =============================================================================

/**
 * Deux segments [a,b] et [c,d] sont co-localisés si leurs milieux sont proches
 * ET leurs orientations sont compatibles (angle < 30°).
 */
function segmentsColocalized(a, b, c, d, thresholdM) {
  // 1. Milieu du segment de référence proche du segment candidat ?
  const midAB = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (distPointToSegment(midAB, c, d) > thresholdM) return false;

  // 2. Orientations compatibles ?
  const b1 = bearingRad(a, b);
  const b2 = bearingRad(c, d);
  if (b1 === null || b2 === null) return false;
  const angleDiff = Math.abs(normalizeAngle(b1 - b2));
  // Compatibles si < 30° ou > 150° (même direction ou direction opposée)
  return angleDiff < (Math.PI / 6) || angleDiff > (5 * Math.PI / 6);
}

/**
 * Pour chaque point de chaque trace, calcule :
 *   - localGroup : liste triée des traceIdx co-localisés (dont soi-même)
 *   - localRank  : position de cette trace dans le groupe
 *
 * Retourne un tableau de tableaux : offsets[traceIdx][pointIdx] = offsetMeters
 */
function computeLocalOffsets(allCoords) {
  const N = allCoords.length;

  // 1. Construire l'index spatial avec tous les segments de toutes les traces
  const index = new SpatialIndex();
  for (let ti = 0; ti < N; ti++) {
    const coords = allCoords[ti];
    for (let si = 0; si < coords.length - 1; si++) {
      index.addSegment(ti, si, coords[si], coords[si + 1]);
    }
  }

  // 2. Pour chaque segment de chaque trace, trouver les voisins co-localisés
  //    et noter pour chaque extrémité quelles traces partagent ce lieu.
  //    pointNeighbors[ti][pi] = Set des traceIdx co-localisés en ce point
  const pointNeighbors = allCoords.map(coords => coords.map(() => new Set()));

  for (let ti = 0; ti < N; ti++) {
    const coords = allCoords[ti];
    for (let si = 0; si < coords.length - 1; si++) {
      const a = coords[si];
      const b = coords[si + 1];

      const nearby = index.nearbySegments(a, b, ti);
      for (const { traceIdx: tj, a: c, b: d } of nearby) {
        if (!segmentsColocalized(a, b, c, d, COLOC_THRESHOLD_M)) continue;
        // Les deux segments sont co-localisés → on note la relation sur les deux extrémités
        pointNeighbors[ti][si].add(tj);
        pointNeighbors[ti][si + 1].add(tj);
        pointNeighbors[tj][/* on n'a pas l'index exact du point tj ici,
                              on le retrouve par proximité */ 0]; // cf. ci-dessous
      }
    }
  }

  // Approche plus simple et robuste : pour chaque point de chaque trace,
  // chercher directement les autres traces qui passent à moins de COLOC_THRESHOLD_M
  // via l'index (on cherche les segments proches du point).
  // On réinitialise et on refait plus proprement :
  const pointGroups = allCoords.map(coords => coords.map(() => new Set()));

  for (let ti = 0; ti < N; ti++) {
    const coords = allCoords[ti];
    for (let pi = 0; pi < coords.length; pi++) {
      const p = coords[pi];
      // Cellule du point
      const ix = Math.floor(p[0] / CELL_SIZE);
      const iy = Math.floor(p[1] / CELL_SIZE);

      // Chercher dans les cellules voisines (3×3)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const key = `${ix + dx},${iy + dy}`;
          for (const { traceIdx: tj, a, b } of (index.grid.get(key) || [])) {
            if (tj === ti) continue;
            if (distPointToSegment(p, a, b) <= COLOC_THRESHOLD_M) {
              pointGroups[ti][pi].add(tj);
            }
          }
        }
      }
    }
  }

  // 3. Calculer l'offset local de chaque point
  //    Groupe = {ti} ∪ pointGroups[ti][pi], trié
  //    Rang = position de ti dans le groupe trié
  //    Offset = (rang - (taille-1)/2) * OFFSET_STEP
  const offsets = allCoords.map((coords, ti) =>
    coords.map((_, pi) => {
      const group = Array.from(pointGroups[ti][pi]);
      group.push(ti);
      group.sort((a, b) => a - b);
      const rank = group.indexOf(ti);
      const size = group.length;
      return (rank - (size - 1) / 2) * OFFSET_STEP;
    })
  );

  return offsets;
}

// =============================================================================
// OFFSET PERPENDICULAIRE (inchangé, mais prend un offset par point)
// =============================================================================

/**
 * Décale chaque point de coords[i] de offsetsPerPoint[i] mètres
 * perpendiculairement à la direction locale de la trace.
 */
function perpendicularOffsetVariable(coords, offsetsPerPoint) {
  return coords.map((coord, i) => {
    const off = offsetsPerPoint[i];
    if (Math.abs(off) < 0.01) return coord;

    try {
      const bBack = backwardBearing(coords, i);
      const bFwd  = forwardBearing(coords, i);

      if (bBack === null && bFwd === null) return coord;

      let perpBearing;
      let effectiveOffset = off;

      if (bBack === null) {
        perpBearing = bFwd - Math.PI / 2;
      } else if (bFwd === null) {
        perpBearing = bBack - Math.PI / 2;
      } else {
        perpBearing = Math.atan2(
          Math.sin(bBack) + Math.sin(bFwd),
          Math.cos(bBack) + Math.cos(bFwd)
        ) - Math.PI / 2;

        const delta = normalizeAngle(bFwd - bBack);

        if (Math.abs(delta) > (2 * Math.PI / 3)) {
          perpBearing = bFwd - Math.PI / 2;
        } else {
          const miter = 1 / Math.max(Math.abs(Math.cos(delta / 2)), 0.4);
          effectiveOffset = off * Math.min(miter, 2.5);
        }
      }

      const [newLon, newLat] = destinationPoint(coord, effectiveOffset, perpBearing);
      return [newLon, newLat, ...coord.slice(2)];
    } catch (_) {
      return coord;
    }
  });
}

// =============================================================================
// LECTURE DES GPX
// =============================================================================

const types = fs.readdirSync(INPUT_DIR).filter(f =>
  fs.statSync(path.join(INPUT_DIR, f)).isDirectory()
);

// Première passe : lire et préparer toutes les traces (simplification + meta)
const allTracks = []; // { rawName, cleanName, type, coordsWithMeta, origFeature }

types.forEach(type => {
  const typeDir = path.join(INPUT_DIR, type);
  const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.gpx'));

  files.forEach(file => {
    try {
      const gpxContent = fs.readFileSync(path.join(typeDir, file), 'utf8');
      const gpxDom = new DOMParser().parseFromString(gpxContent);
      const converted = togeojson.gpx(gpxDom);
      const feature = converted.features.find(f => f.geometry.type === 'LineString');

      if (!feature?.geometry?.coordinates) return;

      const rawName = path.parse(file).name;
      const cleanName = rawName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Simplification
      const simplified = simplify(
        { type: 'Feature', geometry: { type: 'LineString', coordinates: feature.geometry.coordinates.map(c => [c[0], c[1]]) }, properties: {} },
        { tolerance: 0.00001, highQuality: true }
      );

      const simplifiedCoords = simplified.geometry.coordinates;
      let cumulativeDistance = 0;

      const coordsWithMeta = simplifiedCoords.map((coord, i) => {
        if (i > 0) {
          const prev = simplifiedCoords[i - 1];
          cumulativeDistance += distance([prev[0], prev[1]], [coord[0], coord[1]], { units: 'kilometers' });
        }
        const origRatio = i / Math.max(simplifiedCoords.length - 1, 1);
        const origIdx = Math.round(origRatio * (feature.geometry.coordinates.length - 1));
        const alt = feature.geometry.coordinates[origIdx]?.[2] || 0;
        return [coord[0], coord[1], alt, parseFloat(cumulativeDistance.toFixed(3))];
      });

      allTracks.push({ rawName, cleanName, type, coordsWithMeta, origFeature: feature });

    } catch (err) {
      console.error(`❌ Erreur lecture ${file}:`, err.message);
    }
  });
});

// Deuxième passe : calculer les offsets locaux inter-traces
console.log(`\n📐 Calcul des co-localisations sur ${allTracks.length} traces...`);
const allCoords = allTracks.map(t => t.coordsWithMeta);
const localOffsets = computeLocalOffsets(allCoords);

// Troisième passe : appliquer les offsets et construire le GeoJSON
const allFeatures = allTracks.map((track, ti) => {
  const { rawName, cleanName, type, coordsWithMeta, origFeature } = track;
  const offsets = localOffsets[ti];

  // Stats pour le log
  const uniqueOffsets = [...new Set(offsets.map(o => o.toFixed(1)))];
  const maxGroup = Math.round(Math.max(...offsets.map(o => Math.abs(o))) / OFFSET_STEP * 2 + 1);

  const offsetCoords = perpendicularOffsetVariable(coordsWithMeta, offsets);

  origFeature.geometry.coordinates = offsetCoords;
  origFeature.properties = {
    id: `${type.toLowerCase()}-${rawName.toLowerCase()}`,
    name: cleanName,
    type: type.toLowerCase()
  };

  console.log(`✅ ${rawName} (${type}) — ${offsetCoords.length} pts — offsets: [${uniqueOffsets.join(', ')}] m`);
  return origFeature;
});

// =============================================================================
// ÉCRITURE DU GEOJSON
// =============================================================================

const geojson = { type: 'FeatureCollection', features: allFeatures };

const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
console.log(`\n✅ ${allFeatures.length} tracés convertis avec offset local adaptatif.`);