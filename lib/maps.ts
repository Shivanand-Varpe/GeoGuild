/**
 * Utility functions for parsing Google Maps links and extracting GPS coordinates
 */

export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
  parsed: boolean;
  description: string;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Extracts latitude and longitude from various Google Maps link formats with high precision.
 * Supported patterns:
 * - Venue Place Pin (highest precision): !3d<lat>!4d<lng>
 * - Query params: ?q=lat,lng or ?query=lat,lng or ?destination=lat,lng or ?ll=lat,lng or ?center=lat,lng (supports %2C, +, spaces)
 * - Direction paths: /maps/dir//lat,lng or /maps/dir/lat1,lng1/lat2,lng2
 * - Viewport pin: @lat,lng,zoom
 * - Raw coordinates: "12.9716, 77.5946" or "12.9716 77.5946"
 *
 * If the link is a short URL (e.g. maps.app.goo.gl/xxx) or place name without embedded coords,
 * it safely falls back to the selected city center coordinates.
 */
export function parseGoogleMapsCoordinates(
  inputUrl: string,
  cityFallback: { latitude: number; longitude: number; cityName?: string }
): ParsedCoordinates {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return {
      latitude: cityFallback.latitude,
      longitude: cityFallback.longitude,
      parsed: false,
      description: `Defaulting to ${cityFallback.cityName || 'city'} center coordinates`,
    };
  }

  const clean = inputUrl.trim();
  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }

  // Pattern 0: Direct coordinates typed in (e.g. "12.9716, 77.5946" or "12.9716,77.5946")
  const rawCoordsMatch = decoded.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        parsed: true,
        description: `Direct coordinates parsed: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Pattern 1: Exact Venue Pin in place URLs: !3d<lat>!4d<lng> (Highest precision venue coordinates)
  const placeDataMatch = decoded.match(/!3d(-?\d{1,2}(?:\.\d+)?)(?:!4d|.*?!4d)(-?\d{1,3}(?:\.\d+)?)/);
  if (placeDataMatch) {
    const lat = parseFloat(placeDataMatch[1]);
    const lng = parseFloat(placeDataMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        parsed: true,
        description: `Extracted exact venue GPS pin: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Pattern 2: Query / Search / Navigation parameters
  // e.g. ?q=lat,lng | ?query=lat,lng | ?destination=lat,lng | ?daddr=lat,lng | ?ll=lat,lng | ?center=lat,lng
  const paramMatch = decoded.match(
    /(?:[?&/](?:q|query|destination|daddr|ll|sll|center)=(-?\d{1,2}(?:\.\d+)?)(?:%2C|%2c|[,+ ]|\+)+(-?\d{1,3}(?:\.\d+)?))/i
  );
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lng = parseFloat(paramMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        parsed: true,
        description: `Extracted coordinates from query parameters: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Pattern 3: Turn-by-turn Direction path: /dir//lat,lng or /dir/destination_lat,destination_lng
  const dirMatch = decoded.match(
    /\/dir\/(?:.*?\/)?(-?\d{1,2}(?:\.\d+)?)(?:%2C|%2c|[,+ ]|\+)+(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (dirMatch) {
    const lat = parseFloat(dirMatch[1]);
    const lng = parseFloat(dirMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        parsed: true,
        description: `Extracted destination from directions link: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Pattern 4: Viewport camera center: @lat,lng,zoom
  const atMatch = decoded.match(/@(-?\d{1,2}(?:\.\d+)?)(?:%2C|%2c|[,+ ]|\+)+(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        parsed: true,
        description: `Extracted map center coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Fallback for short links (e.g. maps.app.goo.gl/xxx or goo.gl/maps/xxx or place queries)
  const isMapsUrl =
    clean.includes('maps.google.') ||
    clean.includes('goo.gl/maps') ||
    clean.includes('maps.app.goo.gl') ||
    clean.includes('google.com/maps');

  return {
    latitude: cityFallback.latitude,
    longitude: cityFallback.longitude,
    parsed: false,
    description: isMapsUrl
      ? `Using ${cityFallback.cityName || 'city'} center coordinates (Google Maps link attached for attendees)`
      : `Using ${cityFallback.cityName || 'city'} center coordinates`,
  };
}
