import { CompanyNotFoundError, ValidationError } from '../../../shared/errors/errors.js';

/**
 * Caso de uso: Obtiene el estado de seguimiento actual y el historial completo de eventos para una empresa.
 */
export class GetTrackingByCompanyUseCase {
  /**
   * @param {import('../domain/tracking.repository.js').TrackingRepository} trackingRepository
   * @param {import('../../companies/domain/company.repository.js').CompanyRepository | import('../../companies/application/get-company-by-id.usecase.js').GetCompanyByIdUseCase} companyRepositoryOrUseCase
   */
  constructor(trackingRepository, companyRepositoryOrUseCase) {
    if (!trackingRepository) {
      throw new Error('GetTrackingByCompanyUseCase requiere una instancia válida de TrackingRepository.');
    }
    if (!companyRepositoryOrUseCase) {
      throw new Error('GetTrackingByCompanyUseCase requiere un repositorio o caso de uso del módulo companies.');
    }

    this.trackingRepository = trackingRepository;
    this.companyRepositoryOrUseCase = companyRepositoryOrUseCase;
  }

  /**
   * Valida la existencia de la empresa.
   *
   * @private
   * @param {number} companyId
   * @returns {import('../../companies/domain/company.entity.js').Company}
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
    return company;
  }

  /**
   * Ejecuta la consulta de seguimiento para una empresa.
   *
   * @param {number|string} companyId - ID de la empresa
   * @returns {{ company_id: number, company_name: string, status: string, updated_at: string|null, events: Array<Object> }}
   */
  execute(companyId) {
    const numericCompanyId = Number(companyId);
    if (!companyId || isNaN(numericCompanyId) || numericCompanyId <= 0) {
      throw new ValidationError('El ID de empresa provisto es inválido.');
    }

    const company = this._ensureCompanyExists(numericCompanyId);
    const trackingStatus = this.trackingRepository.findByCompanyId(numericCompanyId);
    const events = this.trackingRepository.findEventsByCompanyId(numericCompanyId);

    return {
      company_id: numericCompanyId,
      company_name: company.name,
      status: trackingStatus ? trackingStatus.status : 'pendiente',
      updated_at: trackingStatus ? trackingStatus.updated_at : null,
      events: events.map((event) => event.toJSON()),
    };
  }
}

export default GetTrackingByCompanyUseCase;
