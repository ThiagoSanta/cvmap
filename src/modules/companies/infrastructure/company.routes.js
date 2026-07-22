import { Router } from 'express';
import { CompanyController } from './company.controller.js';

const router = Router();
const controller = new CompanyController();

/**
 * Rutas del módulo de empresas
 * GET /api/companies?city=...&radius=...
 */
router.get('/companies', controller.search);

export default router;
