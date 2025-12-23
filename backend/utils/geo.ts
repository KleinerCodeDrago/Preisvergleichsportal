export interface Location {
    latitude: number;
    longitude: number;
    radiusKm: number;
}

function toRad(value: number): number {
    return (value * Math.PI) / 180;
}

export function haversineKm(a: Location, b: { latitude: number; longitude: number }): number {
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
}

export function isLocal(locations: Location[], offer: { latitude?: number; longitude?: number }): boolean {
    if (!offer.latitude || !offer.longitude) return false;
    return locations.some(loc => haversineKm(loc, offer) <= loc.radiusKm);
}
