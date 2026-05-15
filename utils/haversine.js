// utils/haversine.js
// Haversine formula — calculates great-circle distance between two GPS coordinates

const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometres, rounded to 4 decimal places
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKM = EARTH_RADIUS_KM * c;

  return Math.round(distanceKM * 10000) / 10000; // 4 decimal places for accuracy
}

/**
 * Accumulates distance across an array of coordinates.
 * @param {Array<{lat: number, lng: number}>} coords - Array of coordinate objects
 * @returns {number} Total distance in KM, rounded to 2 decimal places
 */
export function totalDistanceFromCoords(coords) {
  if (!coords || coords.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    total += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }

  return Math.round(total * 100) / 100; // 2 decimal places for display
}

export default haversineDistance;
