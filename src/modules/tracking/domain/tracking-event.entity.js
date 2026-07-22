import { ValidationError } from '../../../shared/errors/errors.js';

/**
 * Lista centralizada de tipos de evento de seguimiento válidos.
 * Coincide con la restricción CHECK de tracking_events en schema.sql.
 */
export const VALID_EVENT_TYPES = Object.freeze([
  'cv_enviado',
  'respuesta',
  'entrevista',
  'otro',
]);

/**
 * Entidad de dominio que representa un evento u hito en el historial de una empresa.
 */
export class TrackingEvent {
  /**
   * @param {Object} params
   * @param {number} [params.id] - PK interna
   * @param {number} params.company_id - FK referente a la empresa
   * @param {string} params.event_type - Tipo de evento ('cv_enviado', 'respuesta', 'entrevista', 'otro')
   * @param {string} params.event_date - Fecha del evento (YYYY-MM-DD o ISO date string)
   * @param {string|null} [params.note] - Nota opcional
   * @param {string|null} [params.created_at] - Fecha/hora ISO de creación
   */
  constructor({
    id = null,
    company_id,
    event_type,
    event_date,
    note = null,
    created_at = null,
  }) {
    this.id = id !== null && id !== undefined ? Number(id) : null;
    this.company_id = company_id !== null && company_id !== undefined ? Number(company_id) : null;
    this.event_type = event_type ? String(event_type).trim() : '';
    this.event_date = event_date ? String(event_date).trim() : '';
    this.note = note ? String(note).trim() : null;
    this.created_at = created_at ? String(created_at) : null;

    this.validate();
  }

  /**
   * Valida la integridad del evento de seguimiento.
   *
   * @throws {ValidationError} Si algún campo obligatorio falta o tiene formato no permitido.
   */
  validate() {
    if (!this.company_id || isNaN(this.company_id) || this.company_id <= 0) {
      throw new ValidationError('El campo "company_id" es obligatorio y debe ser un número entero positivo.');
    }

    if (!VALID_EVENT_TYPES.includes(this.event_type)) {
      throw new ValidationError(
        `El tipo de evento "${this.event_type}" es inválido. Tipos permitidos: ${VALID_EVENT_TYPES.join(', ')}.`
      );
    }

    if (!this.event_date) {
      throw new ValidationError('El campo "event_date" es obligatorio para registrar un evento.');
    }

    // Validar formato de fecha básico (YYYY-MM-DD o parseable por Date)
    const dateParsed = new Date(this.event_date);
    if (isNaN(dateParsed.getTime())) {
      throw new ValidationError(`La fecha de evento "${this.event_date}" es inválida.`);
    }
  }

  /**
   * Convierte la entidad a un objeto plano serializable.
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      company_id: this.company_id,
      event_type: this.event_type,
      event_date: this.event_date,
      note: this.note,
      created_at: this.created_at,
    };
  }
}

/**
 * Factory helper para instanciar un TrackingEvent validado.
 *
 * @param {Object} data
 * @returns {TrackingEvent}
 */
export function createTrackingEvent(data) {
  return new TrackingEvent(data);
}

export default TrackingEvent;
