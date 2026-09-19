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
        zoomControl={false}
        attributionControl={true}
        dragging={true}
        className="h-80 w-full"
      >
        {/* Tiles estilo Airbnb — CARTO Voyager (gratuito, sin API key) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {/* Pin estilo Airbnb: círculo morado con borde blanco */}
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

      {/* Overlay abajo tipo Airbnb */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[400] bg-gradient-to-t from-white/95 via-white/80 to-transparent p-4 pt-8">
        <p className="text-sm font-semibold text-gray-800">
          📍 {address}
        </p>
      </div>
    </div>
  );
}
