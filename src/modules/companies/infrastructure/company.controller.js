import { SqliteCompanyRepository } from './sqlite-company.repository.js';
import { SearchCompaniesUseCase } from '../application/search-companies.usecase.js';
import { AppError, ValidationError } from '../../../shared/errors/errors.js';

/**
 * Controlador HTTP para el módulo de empresas.
 */
export class CompanyController {
  /**
   * @param {SearchCompaniesUseCase} [searchCompaniesUseCase]
   */
  constructor(searchCompaniesUseCase = null) {
    const repository = new SqliteCompanyRepository();
    this.searchCompaniesUseCase = searchCompaniesUseCase || new SearchCompaniesUseCase(repository);
    this.search = this.search.bind(this);
  }

  /**
   * Manejador de la petición GET /api/companies?city=...&radius=...
   */
  async search(req, res, next) {
    try {
      const { city, radius } = req.query;

      if (!city || typeof city !== 'string' || city.trim() === '') {
        throw new ValidationError('El parámetro "city" es obligatorio.');
      }

      const result = await this.searchCompaniesUseCase.execute({ city, radius });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      return next(error);
    }
  }
}

export default CompanyController;
