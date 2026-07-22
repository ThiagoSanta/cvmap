/**
 * Clase base para errores personalizados de la aplicación.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error en la configuración inicial o variables de entorno.
 */
export class ConfigurationError extends AppError {
  constructor(message) {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

/**
 * Error al interactuar con el servicio de geocodificación (Nominatim).
 */
export class GeocodingError extends AppError {
  constructor(message, cause = null) {
    super(message, 502, 'GEOCODING_ERROR');
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Error cuando una ciudad o ubicación no fue encontrada por Nominatim.
 */
export class CityNotFoundError extends AppError {
  constructor(cityName) {
    super(`No se encontró la ciudad "${cityName}". Verifica el nombre e intenta nuevamente.`, 404, 'CITY_NOT_FOUND');
    this.cityName = cityName;
  }
}

/**
 * Error al interactuar con Overpass API (fallo de servidor principal y fallback, timeout, o respuesta inválida).
 */
export class OverpassError extends AppError {
  constructor(message, attemptsDetails = []) {
    super(message, 502, 'OVERPASS_ERROR');
    this.attemptsDetails = attemptsDetails;
  }
}
