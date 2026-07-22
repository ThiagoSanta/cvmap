/**
 * Utilidades geográficas para cálculos de coordenadas y bounding box.
 */

/**
 * Calcula un Bounding Box [south, west, north, east] alrededor de un centro (lat, lon) y un radio en metros.
 * 
 * @param {number} latitude - Latitud del centro (-90 a 90)
 * @param {number} longitude - Longitud del centro (-180 a 180)
 * @param {number} radiusInMeters - Radio de búsqueda en metros
 * @returns {{ south: number, west: number, north: number, east: number, bboxString: string }}
 */
export function calculateBoundingBox(latitude, longitude, radiusInMeters) {
  const METERS_PER_DEGREE_LATITUDE = 111111;
  const latitudeInRadians = (latitude * Math.PI) / 180;

  const deltaLatitude = radiusInMeters / METERS_PER_DEGREE_LATITUDE;
  const deltaLongitude = radiusInMeters / (METERS_PER_DEGREE_LATITUDE * Math.cos(latitudeInRadians));

  const south = Number((latitude - deltaLatitude).toFixed(6));
  const north = Number((latitude + deltaLatitude).toFixed(6));
  const west = Number((longitude - deltaLongitude).toFixed(6));
  const east = Number((longitude + deltaLongitude).toFixed(6));

  return {
    south,
    west,
    north,
    east,
    bboxString: `${south},${west},${north},${east}`,
  };
}
