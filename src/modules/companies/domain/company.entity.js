import { ValidationError } from '../../../shared/errors/errors.js';

/**
 * Entidad de dominio que representa una Empresa en CVMap.
 */
export class Company {
  /**
   * @param {Object} params
   * @param {number} [params.id] - Identificador único interno (PK en base de datos)
   * @param {string} params.osm_id - Identificador único proveniente de OpenStreetMap
   * @param {string} [params.name] - Nombre de la empresa o negocio
   * @param {string|null} [params.address] - Dirección
   * @param {string|null} [params.phone] - Teléfono de contacto
   * @param {string|null} [params.website] - Sitio web
   * @param {string|null} [params.opening_hours] - Horarios de atención
   * @param {string|null} [params.category] - Categoría/rubro en OSM
   * @param {number} params.latitude - Latitud (-90 a 90)
   * @param {number} params.longitude - Longitud (-180 a 180)
   * @param {string|null} [params.cached_at] - Fecha/hora ISO en que se cacheó el registro
   */
  constructor({
    id = null,
    osm_id,
    name = '',
    address = null,
    phone = null,
    website = null,
    opening_hours = null,
    category = null,
    latitude,
    longitude,
    cached_at = null,
  }) {
    this.id = id !== null && id !== undefined ? Number(id) : null;
    this.osm_id = typeof osm_id === 'number' ? String(osm_id) : osm_id;
    this.name = name ? String(name).trim() : '';
    this.address = address ? String(address).trim() : null;
    this.phone = phone ? String(phone).trim() : null;
    this.website = website ? String(website).trim() : null;
    this.opening_hours = opening_hours ? String(opening_hours).trim() : null;
    this.category = category ? String(category).trim() : null;
    this.latitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    this.longitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    this.cached_at = cached_at ? String(cached_at) : null;

    this.validate();
  }

  /**
   * Valida la consistencia e integridad de los datos mínimos de la empresa.
   *
   * @throws {ValidationError} Si la empresa no cumple con la estructura mínima válida.
   */
  validate() {
    if (!this.osm_id || typeof this.osm_id !== 'string' || this.osm_id.trim() === '') {
      throw new ValidationError('El campo "osm_id" es obligatorio y debe ser un identificador no vacío.');
    }

    if (typeof this.latitude !== 'number' || isNaN(this.latitude) || this.latitude < -90 || this.latitude > 90) {
      throw new ValidationError(`La latitud "${this.latitude}" es inválida. Debe ser un número entre -90 y 90.`);
    }

    if (typeof this.longitude !== 'number' || isNaN(this.longitude) || this.longitude < -180 || this.longitude > 180) {
      throw new ValidationError(`La longitud "${this.longitude}" es inválida. Debe ser un número entre -180 y 180.`);
    }
  }

  /**
   * Convierte la entidad a un objeto plano sin métodos ni prototipo.
   *
   * @returns {Object} Objeto plano serializable
   */
  toJSON() {
    return {
      id: this.id,
      osm_id: this.osm_id,
      name: this.name,
      address: this.address,
      phone: this.phone,
      website: this.website,
      opening_hours: this.opening_hours,
      category: this.category,
      latitude: this.latitude,
      longitude: this.longitude,
      cached_at: this.cached_at,
    };
  }
}

/**
 * Factory helper para crear e instanciar una entidad Company de forma segura.
 *
 * @param {Object} data
 * @returns {Company} Instancia de la entidad Company validada
 */
export function createCompany(data) {
  return new Company(data);
}

export default Company;
