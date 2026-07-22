import dotenv from 'dotenv';
import { ConfigurationError } from '../shared/errors/errors.js';

dotenv.config();

/**
 * Valida y formatea las variables de entorno de la aplicación.
 */
function loadAndValidateEnv() {
  const requiredVars = [
    'DB_PATH',
    'NOMINATIM_API_URL',
    'OVERPASS_API_URL',
    'OVERPASS_API_URL_FALLBACK',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName] || process.env[varName].trim() === '');

  if (missingVars.length > 0) {
    throw new ConfigurationError(
      `Faltan variables de entorno requeridas en el archivo .env: ${missingVars.join(', ')}`
    );
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port <= 0) {
    throw new ConfigurationError('La variable PORT debe ser un número entero positivo válido.');
  }

  const cacheExpirationDays = parseInt(process.env.CACHE_EXPIRATION_DAYS || '30', 10);
  if (isNaN(cacheExpirationDays) || cacheExpirationDays <= 0) {
    throw new ConfigurationError('La variable CACHE_EXPIRATION_DAYS debe ser un número entero positivo.');
  }

  const defaultSearchRadius = parseInt(process.env.DEFAULT_SEARCH_RADIUS || '15000', 10);
  if (isNaN(defaultSearchRadius) || defaultSearchRadius <= 0) {
    throw new ConfigurationError('La variable DEFAULT_SEARCH_RADIUS debe ser un número entero positivo.');
  }

  return Object.freeze({
    server: Object.freeze({
      port,
      env: process.env.NODE_ENV || 'development',
    }),
    database: Object.freeze({
      path: process.env.DB_PATH,
    }),
    nominatim: Object.freeze({
      apiUrl: process.env.NOMINATIM_API_URL,
      userAgent: 'CVMap/1.0 (https://github.com/ThiagoSanta/cvmap)',
    }),
    overpass: Object.freeze({
      primaryUrl: process.env.OVERPASS_API_URL,
      fallbackUrl: process.env.OVERPASS_API_URL_FALLBACK,
      timeoutMs: 25000,
    }),
    business: Object.freeze({
      cacheExpirationDays,
      defaultSearchRadius,
    }),
  });
}

export const envConfig = loadAndValidateEnv();
export default envConfig;
