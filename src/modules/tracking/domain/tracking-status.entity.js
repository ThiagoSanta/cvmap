import { ValidationError, InvalidStatusError } from '../../../shared/errors/errors.js';

/**
 * Lista centralizada de estados de seguimiento válidos.
 * Debe coincidir exactamente con la restricción CHECK de la tabla tracking en schema.sql.
 */
export const VALID_TRACKING_STATUSES = Object.freeze([
  'pendiente',
  'cv_enviado',
  'respondio',
  'entrevista',
  'rechazado',
]);

/**
 * Entidad de dominio que representa el estado de seguimiento actual de una empresa.
 */
export class TrackingStatus {
  /**
   * @param {Object} params
   * @param {number} [params.id] - Identificador único interno (PK)
   * @param {number} params.company_id - FK referente a la empresa
   * @param {string} [params.status] - Estado actual del seguimiento
   * @param {string|null} [params.updated_at] - Fecha/hora ISO de la última actualización
   */
  constructor({
    id = null,
    company_id,
    status = 'pendiente',
    updated_at = null,
  }) {
    this.id = id !== null && id !== undefined ? Number(id) : null;
    this.company_id = company_id !== null && company_id !== undefined ? Number(company_id) : null;
    this.status = status ? String(status).trim() : '';
    this.updated_at = updated_at ? String(updated_at) : null;

    this.validate();
  }

  /**
   * Valida los datos requeridos y los valores de enumeración del estado de seguimiento.
   *
   * @throws {ValidationError|InvalidStatusError} Si la entidad no es válida.
   */
  validate() {
    if (!this.company_id || isNaN(this.company_id) || this.company_id <= 0) {
      throw new ValidationError('El campo "company_id" es obligatorio y debe ser un número entero positivo.');
    }

    if (!VALID_TRACKING_STATUSES.includes(this.status)) {
      throw new InvalidStatusError(this.status);
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
      status: this.status,
      updated_at: this.updated_at,
    };
  }
}

/**
 * Factory helper para instanciar un TrackingStatus validado.
 *
 * @param {Object} data
 * @returns {TrackingStatus}
 */
export function createTrackingStatus(data) {
  return new TrackingStatus(data);
}

export default TrackingStatus;
