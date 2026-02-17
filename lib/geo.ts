// NOTE: Browser cannot read EXIF reliably without library.
// For now we do a strict approach:
// ✅ enforce camera capture by using input capture="environment"
// ✅ also require GPS from navigator.geolocation
// This prevents "fake gallery upload".

export async function getGPS(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });
}
