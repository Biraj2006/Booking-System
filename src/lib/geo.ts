import type { UserLocation, GeolocationStatus } from '@/types/clinic';

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate geographic distance between two coordinates using the Haversine formula
 * Returns distance in kilometers (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place (e.g. 0.8, 1.4, 3.8)
  return Math.round(distance * 10) / 10;
}

/**
 * Display distance formatted cleanly according to specifications (e.g., "0.5 km", "1.2 km", "3.8 km")
 */
export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || !isFinite(km)) {
    return 'Distance unknown';
  }
  if (km < 0.1) {
    return 'Nearby (< 100 m)';
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Get native browser geolocation with detailed status and error categorization
 */
export function requestCurrentPosition(): Promise<{
  coords: UserLocation;
  status: GeolocationStatus;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject({
        status: 'unsupported' as GeolocationStatus,
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: 'granted',
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'geolocation',
            addressName: 'Current Location',
          },
        });
      },
      (error) => {
        let status: GeolocationStatus = 'unavailable';
        let message = 'Unable to determine your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = 'denied';
            message = 'Location permission was denied. You can enter your location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            status = 'unavailable';
            message = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            status = 'timeout';
            message = 'Location request timed out. Please try again or enter your location manually.';
            break;
        }

        reject({ status, message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Curated preset cities/neighborhoods for 1-click fallback
 */
export const PRESET_LOCATIONS: { name: string; label: string; lat: number; lng: number }[] = [
  { name: 'Greater Noida (Pari Chowk)', label: 'Greater Noida — Pari Chowk', lat: 28.4744, lng: 77.5040 },
  { name: 'Greater Noida (KP III)', label: 'Greater Noida — Knowledge Park', lat: 28.4615, lng: 77.4925 },
  { name: 'Delhi (Connaught Place)', label: 'Central Delhi — Connaught Place', lat: 28.6315, lng: 77.2215 },
  { name: 'South Delhi (Saket)', label: 'South Delhi — Saket', lat: 28.5244, lng: 77.2066 },
  { name: 'Noida (Sector 62)', label: 'Noida — Sector 62', lat: 28.6280, lng: 77.3649 },
  { name: 'Lower Manhattan', label: 'Downtown NYC (10001)', lat: 40.7128, lng: -74.006 },
];

/**
 * Geocode text location using free OpenStreetMap Nominatim with safe error handling
 */
export async function geocodeLocationName(query: string): Promise<UserLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // 1. Check if user typed one of our presets
  const preset = PRESET_LOCATIONS.find(
    (p) =>
      p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.label.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(p.name.toLowerCase())
  );
  if (preset) {
    return {
      lat: preset.lat,
      lng: preset.lng,
      source: 'preset',
      addressName: preset.name,
    };
  }

  // 2. Query Nominatim API with 5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const encoded = encodeURIComponent(trimmed);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encoded}`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          source: 'manual',
          addressName: item.display_name?.split(',')[0] || trimmed,
        };
      }
    }
  } catch (err) {
    console.warn('Geocoding service error:', err);
  }

  return null;
}

/**
 * Generate external map directions URL (Google Maps standard)
 */
export function getDirectionsUrl(
  clinicLat: number,
  clinicLng: number,
  userLat?: number,
  userLng?: number
): string {
  const destination = `${clinicLat},${clinicLng}`;
  if (userLat !== undefined && userLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destination}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
