import { SqliteTrackingRepository } from './sqlite-tracking.repository.js';
import { SqliteCompanyRepository } from '../../companies/infrastructure/sqlite-company.repository.js';
import { UpdateStatusUseCase } from '../application/update-status.usecase.js';
import { AddEventUseCase } from '../application/add-event.usecase.js';
import { GetTrackingByCompanyUseCase } from '../application/get-tracking-by-company.usecase.js';
import { AppError, ValidationError } from '../../../shared/errors/errors.js';

/**
 * Controlador HTTP para las operaciones del módulo de tracking.
 */
export class TrackingController {
  /**
   * @param {Object} [deps]
   * @param {UpdateStatusUseCase} [deps.updateStatusUseCase]
   * @param {AddEventUseCase} [deps.addEventUseCase]
   * @param {GetTrackingByCompanyUseCase} [deps.getTrackingByCompanyUseCase]
   */
  constructor({
    updateStatusUseCase = null,
    addEventUseCase = null,
    getTrackingByCompanyUseCase = null,
  } = {}) {
    const trackingRepository = new SqliteTrackingRepository();
    const companyRepository = new SqliteCompanyRepository();

    this.updateStatusUseCase =
      updateStatusUseCase || new UpdateStatusUseCase(trackingRepository, companyRepository);
    this.addEventUseCase =
      addEventUseCase || new AddEventUseCase(trackingRepository, companyRepository);
    this.getTrackingByCompanyUseCase =
      getTrackingByCompanyUseCase || new GetTrackingByCompanyUseCase(trackingRepository, companyRepository);

    this.updateStatus = this.updateStatus.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.getByCompanyId = this.getByCompanyId.bind(this);
  }

  /**
   * PATCH /api/tracking/:companyId/status
   */
  async updateStatus(req, res, next) {
    try {
      const { companyId } = req.params;
      const { status } = req.body || {};

      if (!status || typeof status !== 'string' || status.trim() === '') {
        throw new ValidationError('El campo "status" es obligatorio en el cuerpo de la solicitud.');
      }

      const updatedStatus = this.updateStatusUseCase.execute({
        companyId,
        status,
      });

      return res.status(200).json({
        success: true,
        data: updatedStatus.toJSON(),
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

  /**
   * POST /api/tracking/:companyId/events
   */
  async addEvent(req, res, next) {
    try {
      const { companyId } = req.params;
      const { event_type, event_date, note } = req.body || {};

      if (!event_type || typeof event_type !== 'string' || event_type.trim() === '') {
        throw new ValidationError('El campo "event_type" es obligatorio en el cuerpo de la solicitud.');
      }

      if (!event_date) {
        throw new ValidationError('El campo "event_date" es obligatorio en el cuerpo de la solicitud.');
      }

      const newEvent = this.addEventUseCase.execute({
        companyId,
        eventType: event_type,
        eventDate: event_date,
        note,
      });

      return res.status(201).json({
        success: true,
        data: newEvent.toJSON(),
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

  /**
   * GET /api/tracking/:companyId
   */
  async getByCompanyId(req, res, next) {
    try {
      const { companyId } = req.params;

      const trackingData = this.getTrackingByCompanyUseCase.execute(companyId);

      return res.status(200).json({
        success: true,
        data: trackingData,
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

export default TrackingController;
