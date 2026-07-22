import { createCompany } from '../domain/company.entity.js';

/**
 * Extrae la categoría relevante a partir de las etiquetas OSM (office, shop, craft, industrial).
 *
 * @param {Object} tags - Etiquetas del elemento de OSM
 * @returns {string|null} Nombre de la categoría o null si no existe
 */
function extractCategory(tags = {}) {
  const categoryKeys = ['office', 'shop', 'craft', 'industrial'];

  for (const key of categoryKeys) {
    if (tags[key]) {
      const val = String(tags[key]).trim();
      if (val === 'yes' || val === 'true') {
        return key;
      }
      return val;
    }
  }

  return null;
}

/**
 * Extrae la dirección formateada desde las etiquetas OSM.
 *
 * @param {Object} tags
 * @returns {string|null}
 */
function extractAddress(tags = {}) {
  if (tags['addr:full']) {
    return tags['addr:full'].trim();
  }

  const street = tags['addr:street'] ? tags['addr:street'].trim() : '';
  const number = tags['addr:housenumber'] ? tags['addr:housenumber'].trim() : '';

  if (street && number) {
    return `${street} ${number}`;
  }
  if (street) {
    return street;
  }

  return tags.address ? String(tags.address).trim() : null;
}

/**
 * Extrae las coordenadas (lat, lon) de un elemento de Overpass.
 *
 * @param {Object} element
 * @returns {{ latitude: number, longitude: number } | null}
 */
function extractCoordinates(element) {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

/**
 * Caso de uso: transforma elementos crudos de Overpass, aplica reglas de fallback y los persiste/actualiza en el repositorio.
 */
export class CacheCompaniesUseCase {
  /**
   * @param {import('../domain/company.repository.js').CompanyRepository} companyRepository
   */
  constructor(companyRepository) {
    if (!companyRepository) {
      throw new Error('CacheCompaniesUseCase requiere una instancia válida de CompanyRepository.');
    }
    this.companyRepository = companyRepository;
  }

  /**
   * Procesa los elementos crudos de Overpass y los persiste.
   *
   * @param {Array<Object>} overpassElements - Lista de elementos devueltos por Overpass API
   * @returns {Promise<Array<import('../domain/company.entity.js').Company>>|Array<import('../domain/company.entity.js').Company>} Lista de empresas guardadas
   */
  execute(overpassElements) {
    if (!Array.isArray(overpassElements)) {
      return [];
    }

    const savedCompanies = [];

    for (const element of overpassElements) {
      const coords = extractCoordinates(element);
      if (!coords) {
        continue;
      }

      const tags = element.tags || {};
      const osmId = `${element.type}/${element.id}`;

      let category = extractCategory(tags);
      let name = tags.name ? String(tags.name).trim() : '';

      if (!name) {
        name = category || 'Empresa';
      }

      const address = extractAddress(tags);
      const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || null;
      const website = tags.website || tags['contact:website'] || tags.url || null;
      const openingHours = tags.opening_hours || null;

      const companyEntity = createCompany({
        osm_id: osmId,
        name,
        address,
        phone,
        website,
        opening_hours: openingHours,
        category,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const savedCompany = this.companyRepository.save(companyEntity);
      savedCompanies.push(savedCompany);
    }

    return savedCompanies;
  }
}

export default CacheCompaniesUseCase;
