import { geocodeCity } from '../../../config/nominatim-client.js';
import { fetchCompaniesFromOverpass } from '../../../config/overpass-client.js';
import { calculateBoundingBox } from '../../../shared/utils/geo-utils.js';
import { envConfig } from '../../../config/env.js';
import { ValidationError } from '../../../shared/errors/errors.js';
import { CacheCompaniesUseCase } from './cache-companies.usecase.js';

/**
 * Caso de uso: Busca empresas en una ciudad dentro de un radio determinado.
 * Orquesta geocodificación, cálculo de bounding box, consulta/renovación de caché y recuperación desde la base de datos.
 */
export class SearchCompaniesUseCase {
  /**
   * @param {import('../domain/company.repository.js').CompanyRepository} companyRepository
   * @param {CacheCompaniesUseCase} [cacheCompaniesUseCase]
   */
  constructor(companyRepository, cacheCompaniesUseCase = null) {
    if (!companyRepository) {
      throw new Error('SearchCompaniesUseCase requiere una instancia válida de CompanyRepository.');
    }

    this.companyRepository = companyRepository;
    this.cacheCompaniesUseCase = cacheCompaniesUseCase || new CacheCompaniesUseCase(this.companyRepository);
  }

  /**
   * Ejecuta la búsqueda de empresas para la ciudad y radio indicados.
   *
   * @param {Object} params
   * @param {string} params.city - Nombre de la ciudad a buscar (ej: "Cañada de Gómez")
   * @param {number|string} [params.radius] - Radio de búsqueda en metros
   * @returns {Promise<{ city: string, latitude: number, longitude: number, radius: number, count: number, companies: Array<import('../domain/company.entity.js').Company> }>}
   */
  async execute({ city, radius }) {
    if (!city || typeof city !== 'string' || city.trim() === '') {
      throw new ValidationError('El parámetro "city" es obligatorio para realizar la búsqueda.');
    }

    const searchRadius = radius !== undefined && radius !== null && radius !== ''
      ? parseInt(radius, 10)
      : envConfig.business.defaultSearchRadius;

    if (isNaN(searchRadius) || searchRadius <= 0) {
      throw new ValidationError('El parámetro "radius" debe ser un número entero positivo.');
    }

    const geocodeResult = await geocodeCity(city);
    const bbox = calculateBoundingBox(geocodeResult.latitude, geocodeResult.longitude, searchRadius);

    const hasFreshCache = this.companyRepository.hasFreshCacheInBoundingBox(
      bbox,
      envConfig.business.cacheExpirationDays
    );

    if (!hasFreshCache) {
      const rawOverpassData = await fetchCompaniesFromOverpass(bbox.bboxString);
      // fetchCompaniesFromOverpass garantiza que rawOverpassData.elements es un
      // array válido, o lanza OverpassError. No usar fallback || [] para evitar
      // que un resultado parcial o inválido se procese silenciosamente.
      this.cacheCompaniesUseCase.execute(rawOverpassData.elements);
    }

    const companies = this.companyRepository.findByBoundingBox(bbox);

    return {
      city: geocodeResult.displayName,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      radius: searchRadius,
      count: companies.length,
      companies,
    };
  }
}

export default SearchCompaniesUseCase;
