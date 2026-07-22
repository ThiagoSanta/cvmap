import { CompanyNotFoundError } from '../../../shared/errors/errors.js';

/**
 * Caso de uso: Obtiene una empresa por su ID interno.
 * Si la empresa no existe en la base de datos, lanza CompanyNotFoundError.
 */
export class GetCompanyByIdUseCase {
  /**
   * @param {import('../domain/company.repository.js').CompanyRepository} companyRepository
   */
  constructor(companyRepository) {
    if (!companyRepository) {
      throw new Error('GetCompanyByIdUseCase requiere una instancia válida de CompanyRepository.');
    }
    this.companyRepository = companyRepository;
  }

  /**
   * Busca y retorna la empresa correspondiente al ID indicado.
   *
   * @param {number|string} companyId
   * @returns {import('../domain/company.entity.js').Company}
   * @throws {CompanyNotFoundError} Si la empresa no existe
   */
  execute(companyId) {
    const parsedId = Number(companyId);
    if (!companyId || isNaN(parsedId) || parsedId <= 0) {
      throw new CompanyNotFoundError(companyId);
    }

    const company = this.companyRepository.findById(parsedId);
    if (!company) {
      throw new CompanyNotFoundError(parsedId);
    }

    return company;
  }
}

export default GetCompanyByIdUseCase;
