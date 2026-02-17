"use client";

import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

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
        if (!markers.length) return;

        const bounds = L.latLngBounds(
            markers.map((m) => [m.lat, m.lng] as [number, number])
        );

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
    // ✅ Fix marker icon missing in Next bundlers
    useEffect(() => {
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

    const center: LatLngExpression = safeMarkers.length
        ? [safeMarkers[0].lat, safeMarkers[0].lng]
        : [12.9716, 77.5946]; // fallback

    return (
        <div style={{ width: "100%", height }}>
            <MapContainer
                center={center}
                zoom={safeMarkers.length ? 13 : 7}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {safeMarkers.length > 0 && <FitBounds markers={safeMarkers} />}

                {safeMarkers.map((m) => (
                    <Marker
                        key={m.id}
                        position={[m.lat, m.lng]}
                        eventHandlers={{ click: () => m.onClick?.() }}
                    >
                        {(m.title || m.subtitle) && (
                            <Popup>
                                <div style={{ minWidth: 180 }}>
                                    {m.title && <div style={{ fontWeight: 800 }}>{m.title}</div>}
                                    {m.subtitle && (
                                        <div style={{ marginTop: 6, opacity: 0.8 }}>
                                            {m.subtitle}
                                        </div>
                                    )}
                                    {m.onClick && (
                                        <button
                                            style={{
                                                marginTop: 10,
                                                width: "100%",
                                                padding: "10px 12px",
                                                borderRadius: 10,
                                                fontWeight: 800,
                                                color: "white",
                                                background: "#15803d",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
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
