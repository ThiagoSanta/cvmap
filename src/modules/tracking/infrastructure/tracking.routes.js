import { Router } from 'express';
import { TrackingController } from './tracking.controller.js';

const trackingRouter = Router();
const trackingController = new TrackingController();

trackingRouter.patch('/:companyId/status', trackingController.updateStatus);
trackingRouter.post('/:companyId/events', trackingController.addEvent);
trackingRouter.get('/:companyId', trackingController.getByCompanyId);

export default trackingRouter;
