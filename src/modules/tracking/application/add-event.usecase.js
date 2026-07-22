import { CompanyNotFoundError, ValidationError } from '../../../shared/errors/errors.js';
import { createTrackingEvent } from '../domain/tracking-event.entity.js';

/**
 * Caso de uso: Agrega un nuevo evento/hito en el historial de seguimiento de una empresa.
 */
export class AddEventUseCase {
  /**
   * @param {import('../domain/tracking.repository.js').TrackingRepository} trackingRepository
   * @param {import('../../companies/domain/company.repository.js').CompanyRepository | import('../../companies/application/get-company-by-id.usecase.js').GetCompanyByIdUseCase} companyRepositoryOrUseCase
   */
  constructor(trackingRepository, companyRepositoryOrUseCase) {
    if (!trackingRepository) {
      throw new Error('AddEventUseCase requiere una instancia válida de TrackingRepository.');
    }
    if (!companyRepositoryOrUseCase) {
      throw new Error('AddEventUseCase requiere un repositorio o caso de uso del módulo companies.');
    }

    this.trackingRepository = trackingRepository;
    this.companyRepositoryOrUseCase = companyRepositoryOrUseCase;
  }

  /**
   * Valida la existencia de la empresa en la capa de aplicación/dominio de empresas.
   *
   * @private
   * @param {number} companyId
   */
  _ensureCompanyExists(companyId) {
    let company = null;
    if (typeof this.companyRepositoryOrUseCase.execute === 'function') {
      company = this.companyRepositoryOrUseCase.execute(companyId);
    } else if (typeof this.companyRepositoryOrUseCase.findById === 'function') {
      company = this.companyRepositoryOrUseCase.findById(companyId);
    }

    if (!company) {
      throw new CompanyNotFoundError(companyId);
    }
  }

  /**
   * Ejecuta el registro del evento.
   *
   * @param {Object} params
   * @param {number|string} params.companyId - ID de la empresa
   * @param {string} params.eventType - Tipo de evento ('cv_enviado', 'respuesta', 'entrevista', 'otro')
   * @param {string} params.eventDate - Fecha del evento
   * @param {string|null} [params.note] - Nota u observación opcional
   * @returns {import('../domain/tracking-event.entity.js').TrackingEvent} Evento de seguimiento registrado
   */
  execute({ companyId, eventType, eventDate, note }) {
    const numericCompanyId = Number(companyId);
    if (!companyId || isNaN(numericCompanyId) || numericCompanyId <= 0) {
      throw new ValidationError('El ID de empresa provisto es inválido.');
    }

    this._ensureCompanyExists(numericCompanyId);

    const eventEntity = createTrackingEvent({
      company_id: numericCompanyId,
      event_type: eventType,
      event_date: eventDate,
      note,
    });

    return this.trackingRepository.createEvent(eventEntity);
  }
}

export default AddEventUseCase;
