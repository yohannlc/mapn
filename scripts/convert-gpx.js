const togeojson = require('@tmcw/togeojson');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

const INPUT_DIR = './gpx';
const OUTPUT_FILE = './public/data/tracks.json';

// Scanner les dossiers dans ./gpx/ (VTT, Trail, etc.)
const types = fs.readdirSync(INPUT_DIR).filter(f => 
  fs.statSync(path.join(INPUT_DIR, f)).isDirectory()
);

let allFeatures = [];

types.forEach(type => {
  const typeDir = path.join(INPUT_DIR, type);
  const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.gpx'));

  files.forEach(file => {
    const gpxContent = fs.readFileSync(path.join(typeDir, file), 'utf8');
    const gpxDom = new DOMParser().parseFromString(gpxContent);
    const converted = togeojson.gpx(gpxDom);
    
    // On cherche la ligne du tracé
    const feature = converted.features.find(f => f.geometry.type === 'LineString');
    
    if (feature) {
      // Nettoyage du nom (ex: "la-foret-noire" -> "La Foret Noire")
      const rawName = path.parse(file).name;
      const cleanName = rawName.replace(/-/g, ' ');
      
      feature.properties = {
        id: `${type.toLowerCase()}-${rawName.toLowerCase()}`,
        name: cleanName,
        // CHANGEMENT ICI : On force le type en minuscule pour correspondre à PREDEFINED_COLORS
        type: type.toLowerCase() 
      };
      allFeatures.push(feature);
    }
  });
});

const geojson = { type: "FeatureCollection", features: allFeatures };
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));

console.log(`✅ ${allFeatures.length} tracés convertis en GeoJSON (Types en minuscules).`);