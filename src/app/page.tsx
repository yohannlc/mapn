"use client";

import dynamic from 'next/dynamic';

// On charge le composant MapView dynamiquement
// ssr: false empêche Next.js d'essayer de générer la carte sur le serveur
const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        {/* Un petit spinner ou un texte sympa pendant le chargement */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-600">Chargement de la carte...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="h-screen w-full overflow-hidden">
      {/* Le conteneur doit faire 100% de la hauteur/largeur 
          pour que Mapbox occupe tout l'espace 
      */}
      <MapView />
    </main>
  );
}