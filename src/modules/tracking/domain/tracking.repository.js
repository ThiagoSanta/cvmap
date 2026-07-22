/**
 * Interfaz / contrato abstracto para la persistencia del módulo de tracking.
 * Define la estructura que debe implementar el adaptador de infraestructura (ej: sqlite-tracking.repository.js).
 */
export class TrackingRepository {
  /**
   * Busca el estado de seguimiento actual registrado para una empresa.
   *
   * @param {number|string} companyId - PK de la empresa
   * @returns {Promise<import('./tracking-status.entity.js').TrackingStatus|null>|import('./tracking-status.entity.js').TrackingStatus|null}
   */
  findByCompanyId(companyId) {
    throw new Error('El método findByCompanyId() no ha sido implementado.');
  }

  /**
   * Crea o actualiza (upsert) el estado de seguimiento de una empresa.
   *
   * @param {number|string} companyId - PK de la empresa
   * @param {string} status - Nuevo estado a asignar
   * @returns {Promise<import('./tracking-status.entity.js').TrackingStatus>|import('./tracking-status.entity.js').TrackingStatus}
   */
  upsertStatus(companyId, status) {
    throw new Error('El método upsertStatus() no ha sido implementado.');
  }

  /**
   * Inserta un nuevo evento en el historial de seguimiento de una empresa.
   *
   * @param {import('./tracking-event.entity.js').TrackingEvent} event - Instancia de TrackingEvent
   * @returns {Promise<import('./tracking-event.entity.js').TrackingEvent>|import('./tracking-event.entity.js').TrackingEvent}
   */
  createEvent(event) {
    throw new Error('El método createEvent() no ha sido implementado.');
  }

  /**
   * Obtiene la lista de eventos de seguimiento registrados para una empresa.
   *
   * @param {number|string} companyId - PK de la empresa
   * @returns {Promise<Array<import('./tracking-event.entity.js').TrackingEvent>>|Array<import('./tracking-event.entity.js').TrackingEvent>}
   */
  findEventsByCompanyId(companyId) {
    throw new Error('El método findEventsByCompanyId() no ha sido implementado.');
  }
}

export default TrackingRepository;
