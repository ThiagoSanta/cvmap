import { db } from '../../../config/database.js';
import { TrackingRepository } from '../domain/tracking.repository.js';
import { createTrackingStatus } from '../domain/tracking-status.entity.js';
import { createTrackingEvent } from '../domain/tracking-event.entity.js';

/**
 * Mapea una fila de la tabla `tracking` a la entidad TrackingStatus.
 *
 * @param {Object} row
 * @returns {import('../domain/tracking-status.entity.js').TrackingStatus|null}
 */
function mapTrackingStatusRow(row) {
  if (!row) return null;
  return createTrackingStatus({
    id: row.id,
    company_id: row.company_id,
    status: row.status,
    updated_at: row.updated_at,
  });
}

/**
 * Mapea una fila de la tabla `tracking_events` a la entidad TrackingEvent.
 *
 * @param {Object} row
 * @returns {import('../domain/tracking-event.entity.js').TrackingEvent|null}
 */
function mapTrackingEventRow(row) {
  if (!row) return null;
  return createTrackingEvent({
    id: row.id,
    company_id: row.company_id,
    event_type: row.event_type,
    event_date: row.event_date,
    note: row.note,
    created_at: row.created_at,
  });
}

/**
 * Adaptador de infraestructura para tracking usando SQLite (better-sqlite3).
 */
export class SqliteTrackingRepository extends TrackingRepository {
  constructor(databaseInstance = db) {
    super();
    this.db = databaseInstance;

    this.findByCompanyIdStmt = this.db.prepare(`
      SELECT id, company_id, status, updated_at
      FROM tracking
      WHERE company_id = ?
    `);

    this.upsertStatusStmt = this.db.prepare(`
      INSERT INTO tracking (company_id, status, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(company_id) DO UPDATE SET
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `);

    this.createEventStmt = this.db.prepare(`
      INSERT INTO tracking_events (company_id, event_type, event_date, note, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    this.findEventByIdStmt = this.db.prepare(`
      SELECT id, company_id, event_type, event_date, note, created_at
      FROM tracking_events
      WHERE id = ?
    `);

    this.findEventsByCompanyIdStmt = this.db.prepare(`
      SELECT id, company_id, event_type, event_date, note, created_at
      FROM tracking_events
      WHERE company_id = ?
      ORDER BY event_date DESC, id DESC
    `);
  }

  /**
   * Busca el registro de estado de seguimiento para una empresa por su company_id.
   *
   * @param {number|string} companyId
   * @returns {import('../domain/tracking-status.entity.js').TrackingStatus|null}
   */
  findByCompanyId(companyId) {
    const row = this.findByCompanyIdStmt.get(Number(companyId));
    return mapTrackingStatusRow(row);
  }

  /**
   * Actualiza o inserta el estado de seguimiento de una empresa.
   *
   * @param {number|string} companyId
   * @param {string} status
   * @returns {import('../domain/tracking-status.entity.js').TrackingStatus}
   */
  upsertStatus(companyId, status) {
    const numericCompanyId = Number(companyId);
    // Valida y construye la entidad para asegurar validez antes de ejecutar SQL
    const statusEntity = createTrackingStatus({
      company_id: numericCompanyId,
      status,
    });

    this.upsertStatusStmt.run(statusEntity.company_id, statusEntity.status);
    return this.findByCompanyId(numericCompanyId);
  }

  /**
   * Inserta un nuevo evento en tracking_events.
   *
   * @param {import('../domain/tracking-event.entity.js').TrackingEvent} event
   * @returns {import('../domain/tracking-event.entity.js').TrackingEvent}
   */
  createEvent(event) {
    const result = this.createEventStmt.run(
      event.company_id,
      event.event_type,
      event.event_date,
      event.note
    );

    const insertedRow = this.findEventByIdStmt.get(result.lastInsertRowid);
    return mapTrackingEventRow(insertedRow);
  }

  /**
   * Obtiene el listado de eventos ordenados por fecha descendente para una empresa.
   *
   * @param {number|string} companyId
   * @returns {Array<import('../domain/tracking-event.entity.js').TrackingEvent>}
   */
  findEventsByCompanyId(companyId) {
    const rows = this.findEventsByCompanyIdStmt.all(Number(companyId));
    return rows.map(mapTrackingEventRow);
  }
}

export default SqliteTrackingRepository;
