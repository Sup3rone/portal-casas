"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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
      <div className="flex h-72 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-72 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[lat, lng]}
          radius={10}
          pathOptions={{ color: "#6d4aff", fillColor: "#6d4aff", fillOpacity: 0.8 }}
        >
          <Popup>{address}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
