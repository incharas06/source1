"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

export type MapMarker = {
    id: string;
    lat: number;
    lng: number;
    title?: string;
    subtitle?: string;
    onClick?: () => void;
};

function FitBounds({ markers }: { markers: MapMarker[] }) {
    const map = useMap();

    useEffect(() => {
        if (!markers?.length) return;

        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [30, 30] });
    }, [map, markers]);

    return null;
}

export default function Map({
    markers,
    height = "100%",
}: {
    markers: MapMarker[];
    height?: string;
}) {
    // ✅ Fix default marker icon missing in Next bundlers
    useEffect(() => {
        // Prevent re-setting icons multiple times
        const anyL = L as any;
        if (anyL.__VITAL_ICON_FIXED__) return;
        anyL.__VITAL_ICON_FIXED__ = true;

        delete (L.Icon.Default.prototype as any)._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
    }, []);

    const safeMarkers = (markers || []).filter(
        (m) => Number.isFinite(m.lat) && Number.isFinite(m.lng)
    );

    // Fallback center (Karnataka-ish) if no markers
    const center: [number, number] = safeMarkers.length
        ? [safeMarkers[0].lat, safeMarkers[0].lng]
        : [12.9716, 77.5946];

    return (
        <div style={{ width: "100%", height }}>
            <MapContainer
                center={center}
                zoom={safeMarkers.length ? 13 : 7}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    // OpenStreetMap tiles
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {safeMarkers.length > 0 && <FitBounds markers={safeMarkers} />}

                {safeMarkers.map((m) => (
                    <Marker
                        key={m.id}
                        position={[m.lat, m.lng]}
                        eventHandlers={{
                            click: () => m.onClick?.(),
                        }}
                    >
                        {(m.title || m.subtitle) && (
                            <Popup>
                                <div className="min-w-[180px]">
                                    {m.title && <div className="font-extrabold">{m.title}</div>}
                                    {m.subtitle && (
                                        <div className="text-sm opacity-80 mt-1">{m.subtitle}</div>
                                    )}
                                    {m.onClick && (
                                        <button
                                            className="mt-3 w-full rounded-lg bg-green-700 text-white font-bold py-2"
                                            onClick={() => m.onClick?.()}
                                        >
                                            Open
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
