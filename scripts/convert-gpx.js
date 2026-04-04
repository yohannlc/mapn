const togeojson = require('@tmcw/togeojson');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const distance = require('@turf/distance').default; // On importe le calcul de distance

const INPUT_DIR = './gpx';
const OUTPUT_FILE = './public/data/tracks.json';

// Vérifier si le dossier source existe
if (!fs.existsSync(INPUT_DIR)) {
  console.error(`❌ Le dossier ${INPUT_DIR} n'existe pas.`);
  process.exit(1);
}

// Scanner les dossiers (vtt, marche, etc.)
const types = fs.readdirSync(INPUT_DIR).filter(f => 
  fs.statSync(path.join(INPUT_DIR, f)).isDirectory()
);

let allFeatures = [];

types.forEach(type => {
  const typeDir = path.join(INPUT_DIR, type);
  const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.gpx'));

  files.forEach(file => {
    try {
      const gpxContent = fs.readFileSync(path.join(typeDir, file), 'utf8');
      const gpxDom = new DOMParser().parseFromString(gpxContent);
      const converted = togeojson.gpx(gpxDom);
      
      // On cherche la ligne du tracé
      const feature = converted.features.find(f => f.geometry.type === 'LineString');
      
      if (feature && feature.geometry.coordinates) {
        const rawName = path.parse(file).name;
        // On nettoie le nom pour l'affichage (ex: "vtt-15km" -> "Vtt 15km")
        const cleanName = rawName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // --- CALCUL DE LA DISTANCE CUMULÉE ---
        let cumulativeDistance = 0;
        const originalCoords = feature.geometry.coordinates;
        
        const coordsWithDist = originalCoords.map((coord, i) => {
          if (i > 0) {
            const prev = originalCoords[i - 1];
            // Calcul de la distance entre le point i-1 et i en kilomètres
            const d = distance([prev[0], prev[1]], [coord[0], coord[1]], { units: 'kilometers' });
            cumulativeDistance += d;
          }
          
          // On retourne [lng, lat, alt, dist]
          // dist est arrondi à 3 décimales pour gagner de la place dans le JSON (précision au mètre)
          return [
            coord[0], 
            coord[1], 
            coord[2] || 0, 
            parseFloat(cumulativeDistance.toFixed(3))
          ];
        });

        // Mise à jour de la géométrie avec la 4ème dimension (distance)
        feature.geometry.coordinates = coordsWithDist;
        
        feature.properties = {
          id: `${type.toLowerCase()}-${rawName.toLowerCase()}`,
          name: cleanName,
          type: type.toLowerCase() 
        };
        
        allFeatures.push(feature);
      }
    } catch (err) {
      console.error(`❌ Erreur sur le fichier ${file}:`, err.message);
    }
  });
});

const geojson = { type: "FeatureCollection", features: allFeatures };

// On crée le dossier de sortie s'il n'existe pas
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));

console.log(`✅ ${allFeatures.length} tracés convertis.`);
console.log(`🚀 Distance pré-calculée incluse dans le GeoJSON.`);