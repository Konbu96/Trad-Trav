"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 北海道の中心座標
const HOKKAIDO_CENTER: [number, number] = [43.0642, 141.3469];
const DEFAULT_ZOOM = 7;

export default function MapView() {
  // Retinaディスプレイかどうかを検出
  const isRetina = typeof window !== "undefined" && window.devicePixelRatio > 1;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={HOKKAIDO_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="w-full h-full"
        minZoom={6}
        maxZoom={18}
        // 北海道の範囲に制限
        maxBounds={[
          [40.5, 138.0], // 南西
          [46.0, 146.5], // 北東
        ]}
        maxBoundsViscosity={1.0}
      >
        {/* CartoDB Voyager - 高画質で見やすいマップタイル */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={
            isRetina
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          }
          tileSize={256}
          zoomOffset={0}
          detectRetina={true}
        />
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}

