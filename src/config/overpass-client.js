import { envConfig } from './env.js';
import { OverpassError } from '../shared/errors/errors.js';
import { calculateBoundingBox } from '../shared/utils/geo-utils.js';

/**
 * Genera la consulta Overpass QL para buscar empresas en un bounding box.
 * Filtra únicamente por las etiquetas: office, shop, craft, industrial.
 *
 * @param {string} bboxString - Coordenadas en formato "south,west,north,east"
 * @returns {string} Consulta Overpass QL
 */
function buildOverpassQuery(bboxString) {
  return `[out:json][timeout:25];
(
  nwr["office"](${bboxString});
  nwr["shop"](${bboxString});
  nwr["craft"](${bboxString});
  nwr["industrial"](${bboxString});
);
out center;`;
}

/**
 * Normaliza los parámetros de entrada a un string de bounding box "south,west,north,east".
 */
function normalizeBoundingBox(bboxInput) {
  if (typeof bboxInput === 'string') {
    return bboxInput;
  }

  if (Array.isArray(bboxInput) && bboxInput.length === 4) {
    return bboxInput.join(',');
  }

  if (typeof bboxInput === 'object' && bboxInput !== null) {
    const { south, west, north, east } = bboxInput;
    if (
      typeof south === 'number' &&
      typeof west === 'number' &&
      typeof north === 'number' &&
      typeof east === 'number'
    ) {
      return `${south},${west},${north},${east}`;
    }
  }

  throw new OverpassError('El bounding box proporcionado es inválido. Debe ser una cadena "south,west,north,east", una lista de 4 números o un objeto {south, west, north, east}.');
}

/**
 * Realiza una petición a una URL de la API de Overpass enviando la query.
 */
async function fetchFromEndpoint(endpointUrl, query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), envConfig.overpass.timeoutMs);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
        'User-Agent': envConfig.nominatim.userAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `HTTP Status ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.elements)) {
      return {
        success: false,
        status: response.status,
        error: 'La respuesta de Overpass no contiene una estructura JSON válida con la propiedad "elements".',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error.name === 'AbortError'
      ? `Timeout al consultar Overpass (excedido el tiempo límite de ${envConfig.overpass.timeoutMs}ms)`
      : error.message;

    return {
      success: false,
      status: 0,
      error: errorMessage,
    };
  }
}

/**
 * Consulta la API de Overpass para obtener empresas/negocios dentro de un Bounding Box.
 * Intenta con el servidor principal y, en caso de fallo, reintenta secuencialmente con servidores fallback.
 *
 * @param {string|Array<number>|{south:number,west:number,north:number,east:number}} bboxInput - Bounding Box
 * @returns {Promise<{ elements: Array<object>, [key: string]: any }>} JSON crudo de la respuesta de Overpass
 * @throws {OverpassError} Si fallan todos los servidores configurados
 */
export async function fetchCompaniesFromOverpass(bboxInput) {
  const bboxString = normalizeBoundingBox(bboxInput);
  const query = buildOverpassQuery(bboxString);

  const endpoints = [
    envConfig.overpass.primaryUrl,
    envConfig.overpass.fallbackUrl,
    'https://overpass.nchc.org.tw/api/interpreter',
  ].filter(Boolean);

  const attemptsDetails = [];

  for (let i = 0; i < endpoints.length; i++) {
    const endpointUrl = endpoints[i];
    const isLast = i === endpoints.length - 1;

    const result = await fetchFromEndpoint(endpointUrl, query);

    if (result.success) {
      return result.data;
    }

    attemptsDetails.push({
      endpoint: endpointUrl,
      error: result.error,
      status: result.status,
    });

    if (!isLast) {
      console.warn(
        `[Overpass Client] Falló el servidor (${endpointUrl}): ${result.error}. Intentando con servidor alternativo...`
      );
    }
  }

  throw new OverpassError(
    `Error al obtener datos de empresas desde Overpass API. Fallaron todos los servidores consultados (${endpoints.length} intentos).`,
    attemptsDetails
  );
}

/**
 * Helper para consultar Overpass pasándole coordenadas centrales y un radio en metros.
 *
 * @param {number} latitude - Latitud central
 * @param {number} longitude - Longitud central
 * @param {number} radiusInMeters - Radio en metros (opcional, por defecto el del env)
 */
export async function fetchCompaniesAround(latitude, longitude, radiusInMeters = envConfig.business.defaultSearchRadius) {
  const { bboxString } = calculateBoundingBox(latitude, longitude, radiusInMeters);
  return fetchCompaniesFromOverpass(bboxString);
}

export default fetchCompaniesFromOverpass;
