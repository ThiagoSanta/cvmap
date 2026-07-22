/**
 * Interfaz / contrato abstracto para la persistencia de empresas.
 * Define la estructura que deben implementar los adaptadores de infraestructura (ej: sqlite-company.repository.js).
 */
export class CompanyRepository {
  /**
   * Busca una empresa en el almacenamiento por su PK interna (id).
   *
   * @param {number|string} id - Identificador único interno
   * @returns {Promise<import('./company.entity.js').Company|null>|import('./company.entity.js').Company|null}
   */
  findById(id) {
    throw new Error('El método findById() no ha sido implementado.');
  }

  /**
   * Busca una empresa en el almacenamiento por su identificador osm_id.
   *
   * @param {string} osmId - Identificador único de OpenStreetMap
   * @returns {Promise<import('./company.entity.js').Company|null>|import('./company.entity.js').Company|null}
   */
  findByOsmId(osmId) {
    throw new Error('El método findByOsmId() no ha sido implementado.');
  }

  /**
   * Guarda o actualiza una entidad Company en el almacenamiento.
   *
   * @param {import('./company.entity.js').Company} company - Instancia de entidad Company
   * @returns {Promise<import('./company.entity.js').Company>|import('./company.entity.js').Company}
   */
  save(company) {
    throw new Error('El método save() no ha sido implementado.');
  }

  /**
   * Busca las empresas cuyo punto (latitude, longitude) cae dentro del Bounding Box especificado.
   *
   * @param {{ south: number, west: number, north: number, east: number }} bbox
   * @returns {Promise<Array<import('./company.entity.js').Company>>|Array<import('./company.entity.js').Company>}
   */
  findByBoundingBox(bbox) {
    throw new Error('El método findByBoundingBox() no ha sido implementado.');
  }

  /**
   * Determina si existe una búsqueda previa con caché vigente dentro del Bounding Box.
   *
   * @param {{ south: number, west: number, north: number, east: number }} bbox
   * @param {number} maxAgeDays - Días máximos de antigüedad del caché (por defecto CACHE_EXPIRATION_DAYS)
   * @returns {Promise<boolean>|boolean} Retorna true si hay empresas cacheadas cuya fecha de registro no supere maxAgeDays
   */
  hasFreshCacheInBoundingBox(bbox, maxAgeDays) {
    throw new Error('El método hasFreshCacheInBoundingBox() no ha sido implementado.');
  }
}

export default CompanyRepository;
