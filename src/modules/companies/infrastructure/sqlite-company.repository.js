import { db } from '../../../config/database.js';
import { envConfig } from '../../../config/env.js';
import { CompanyRepository } from '../domain/company.repository.js';
import { createCompany } from '../domain/company.entity.js';

/**
 * Mapea una fila retornada por SQLite a una entidad de dominio Company.
 *
 * @param {Object} row
 * @returns {import('../domain/company.entity.js').Company}
 */
function mapRowToEntity(row) {
  if (!row) return null;

  return createCompany({
    id: row.id,
    osm_id: row.osm_id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    website: row.website,
    opening_hours: row.opening_hours,
    category: row.category,
    latitude: row.latitude,
    longitude: row.longitude,
    cached_at: row.cached_at,
  });
}

/**
 * Adaptador de infraestructura que implementa CompanyRepository utilizando SQLite (better-sqlite3).
 */
export class SqliteCompanyRepository extends CompanyRepository {
  constructor(databaseInstance = db) {
    super();
    this.db = databaseInstance;

    this.findByIdStmt = this.db.prepare(
      'SELECT id, osm_id, name, address, phone, website, opening_hours, category, latitude, longitude, cached_at FROM companies WHERE id = ?'
    );

    this.findByOsmIdStmt = this.db.prepare(
      'SELECT id, osm_id, name, address, phone, website, opening_hours, category, latitude, longitude, cached_at FROM companies WHERE osm_id = ?'
    );

    this.upsertCompanyStmt = this.db.prepare(`
      INSERT INTO companies (
        osm_id, name, address, phone, website, opening_hours, category, latitude, longitude, cached_at
      ) VALUES (
        @osm_id, @name, @address, @phone, @website, @opening_hours, @category, @latitude, @longitude, CURRENT_TIMESTAMP
      )
      ON CONFLICT(osm_id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        phone = excluded.phone,
        website = excluded.website,
        opening_hours = excluded.opening_hours,
        category = excluded.category,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        cached_at = CURRENT_TIMESTAMP
    `);

    this.findByBboxStmt = this.db.prepare(`
      SELECT id, osm_id, name, address, phone, website, opening_hours, category, latitude, longitude, cached_at
      FROM companies
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
      ORDER BY name ASC
    `);

    this.countFreshCacheStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        AND datetime(cached_at) >= datetime('now', '-' || ? || ' days')
    `);
  }

  /**
   * Busca una empresa por su ID interno.
   *
   * @param {number|string} id
   * @returns {import('../domain/company.entity.js').Company|null}
   */
  findById(id) {
    const row = this.findByIdStmt.get(Number(id));
    return mapRowToEntity(row);
  }

  /**
   * Busca una empresa por su osm_id.
   *
   * @param {string} osmId
   * @returns {import('../domain/company.entity.js').Company|null}
   */
  findByOsmId(osmId) {
    const row = this.findByOsmIdStmt.get(String(osmId));
    return mapRowToEntity(row);
  }

  /**
   * Persiste o actualiza (upsert) una empresa en la base de datos.
   *
   * @param {import('../domain/company.entity.js').Company} company
   * @returns {import('../domain/company.entity.js').Company}
   */
  save(company) {
    const companyData = {
      osm_id: company.osm_id,
      name: company.name,
      address: company.address,
      phone: company.phone,
      website: company.website,
      opening_hours: company.opening_hours,
      category: company.category,
      latitude: company.latitude,
      longitude: company.longitude,
    };

    this.upsertCompanyStmt.run(companyData);
    return this.findByOsmId(company.osm_id);
  }

  /**
   * Busca empresas comprendidas dentro del bounding box dado.
   *
   * @param {{ south: number, west: number, north: number, east: number }} bbox
   * @returns {Array<import('../domain/company.entity.js').Company>}
   */
  findByBoundingBox(bbox) {
    const minLat = Math.min(bbox.south, bbox.north);
    const maxLat = Math.max(bbox.south, bbox.north);
    const minLon = Math.min(bbox.west, bbox.east);
    const maxLon = Math.max(bbox.west, bbox.east);

    const rows = this.findByBboxStmt.all(minLat, maxLat, minLon, maxLon);
    return rows.map(mapRowToEntity);
  }

  /**
   * Chequea si el área delimitada por bbox posee empresas guardadas cuya antigüedad sea menor a maxAgeDays.
   *
   * @param {{ south: number, west: number, north: number, east: number }} bbox
   * @param {number} [maxAgeDays] - Antigüedad máxima en días (por defecto usa CACHE_EXPIRATION_DAYS del envConfig)
   * @returns {boolean}
   */
  hasFreshCacheInBoundingBox(bbox, maxAgeDays = envConfig.business.cacheExpirationDays) {
    const minLat = Math.min(bbox.south, bbox.north);
    const maxLat = Math.max(bbox.south, bbox.north);
    const minLon = Math.min(bbox.west, bbox.east);
    const maxLon = Math.max(bbox.west, bbox.east);

    const result = this.countFreshCacheStmt.get(minLat, maxLat, minLon, maxLon, String(maxAgeDays));
    return result && result.count > 0;
  }
}

export default SqliteCompanyRepository;
