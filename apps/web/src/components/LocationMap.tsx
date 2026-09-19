"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  address: string;
};

export default function LocationMap({ lat, lng, address }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={true}              // ✅ Botones +/- incluidos
        attributionControl={true}
        dragging={true}
        className="aspect-square w-full"  // ✅ Mapa cuadrado
      >
        {/* Tiles ESRI World Street Map (gratuito, sin API key) */}
        <TileLayer
          attribution="Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        {/* Pin estilo Airbnb */}
        <CircleMarker
          center={[lat, lng]}
          radius={12}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#FF385C",
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            {address}
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Overlay de dirección abajo */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[400] bg-gradient-to-t from-white/95 via-white/80 to-transparent p-4 pt-8">
        <p className="text-sm font-semibold text-gray-800">
          📍 {address}
        </p>
      </div>
    </div>
  );
}
