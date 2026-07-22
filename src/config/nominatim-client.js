import { envConfig } from './env.js';
import { GeocodingError, CityNotFoundError } from '../shared/errors/errors.js';

/**
 * Geocodifica el nombre de una ciudad llamando a la API de Nominatim.
 *
 * @param {string} cityName - Nombre de la ciudad a buscar (ej: "Cañada de Gómez").
 * @returns {Promise<{ cityName: string, latitude: number, longitude: number, displayName: string, boundingBox: Array<string> }>}
 * @throws {CityNotFoundError} Si Nominatim no devuelve ningún resultado.
 * @throws {GeocodingError} Si ocurre un error de red, timeout o HTTP en la consulta.
 */
export async function geocodeCity(cityName) {
  if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
    throw new GeocodingError('El nombre de la ciudad es obligatorio para realizar la búsqueda.');
  }

  const cleanCityName = cityName.trim();
  const searchUrl = new URL(envConfig.nominatim.apiUrl);
  searchUrl.searchParams.append('q', cleanCityName);
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('limit', '1');

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': envConfig.nominatim.userAgent,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new GeocodingError(`Timeout al intentar geocodificar la ciudad "${cleanCityName}" vía Nominatim (excedido límite de 10s).`, error);
    }
    throw new GeocodingError(`Error de conexión al consultar Nominatim para la ciudad "${cleanCityName}": ${error.message}`, error);
  }

  if (!response.ok) {
    throw new GeocodingError(
      `Respuesta HTTP fallida de Nominatim (${response.status} ${response.statusText}) al buscar "${cleanCityName}".`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new GeocodingError(`Error al parsear la respuesta JSON de Nominatim para "${cleanCityName}": ${error.message}`, error);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new CityNotFoundError(cleanCityName);
  }

  const firstResult = data[0];
  const latitude = parseFloat(firstResult.lat);
  const longitude = parseFloat(firstResult.lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new GeocodingError(`Nominatim devolvió coordenadas inválidas para "${cleanCityName}": lat=${firstResult.lat}, lon=${firstResult.lon}`);
  }

  return {
    cityName: cleanCityName,
    latitude,
    longitude,
    displayName: firstResult.display_name || cleanCityName,
    boundingBox: firstResult.boundingbox || null,
  };
}

export default geocodeCity;
