import { SqliteCompanyRepository } from '../src/modules/companies/infrastructure/sqlite-company.repository.js';
import { createCompany } from '../src/modules/companies/domain/company.entity.js';
import { SqliteTrackingRepository } from '../src/modules/tracking/infrastructure/sqlite-tracking.repository.js';
import { UpdateStatusUseCase } from '../src/modules/tracking/application/update-status.usecase.js';
import { AddEventUseCase } from '../src/modules/tracking/application/add-event.usecase.js';
import { GetTrackingByCompanyUseCase } from '../src/modules/tracking/application/get-tracking-by-company.usecase.js';
import { CompanyNotFoundError, InvalidStatusError, ValidationError } from '../src/shared/errors/errors.js';

async function runTest() {
  console.log('=== PRUEBA MANUAL: MÓDULO TRACKING ===\n');

  const companyRepo = new SqliteCompanyRepository();
  const trackingRepo = new SqliteTrackingRepository();

  const updateStatusUseCase = new UpdateStatusUseCase(trackingRepo, companyRepo);
  const addEventUseCase = new AddEventUseCase(trackingRepo, companyRepo);
  const getTrackingUseCase = new GetTrackingByCompanyUseCase(trackingRepo, companyRepo);

  // 1. Crear / verificar empresa de prueba
  console.log('1. Creando / asegurando empresa de prueba...');
  const testOsmId = 'node/test-tracking-001';
  let company = companyRepo.findByOsmId(testOsmId);

  if (!company) {
    company = companyRepo.save(
      createCompany({
        osm_id: testOsmId,
        name: 'Empresa Test Tracking S.A.',
        address: 'Av. Siempre Viva 123',
        phone: '+54 341 555-0199',
        website: 'https://test-tracking.example.com',
        category: 'it_company',
        latitude: -32.9468,
        longitude: -60.6393,
      })
    );
  }
  console.log(`   [OK] Empresa lista con ID: ${company.id} ("${company.name}")`);

  // 2. Actualizar su status
  console.log('\n2. Actualizando status a "cv_enviado"...');
  const updatedStatus = updateStatusUseCase.execute({
    companyId: company.id,
    status: 'cv_enviado',
  });
  console.log('   [OK] Estado actualizado:', updatedStatus.toJSON());

  // 3. Agregar un par de eventos con fechas distintas
  console.log('\n3. Registrando eventos de seguimiento...');
  const event1 = addEventUseCase.execute({
    companyId: company.id,
    eventType: 'cv_enviado',
    eventDate: '2026-07-01',
    note: 'Primer envío de CV a través del sitio web corporativo.',
  });
  console.log('   [OK] Evento 1 agregado:', event1.toJSON());

  const event2 = addEventUseCase.execute({
    companyId: company.id,
    eventType: 'respuesta',
    eventDate: '2026-07-15',
    note: 'Contacto de RRHH confirmando recepción y coordinando entrevista.',
  });
  console.log('   [OK] Evento 2 agregado:', event2.toJSON());

  // 4. Leer el estado completo
  console.log('\n4. Leyendo estado completo de la empresa...');
  const fullTracking = getTrackingUseCase.execute(company.id);
  console.log('   [OK] Estado completo consolidado:');
  console.dir(fullTracking, { depth: null, colors: true });

  // 5. Pruebas de error esperado
  console.log('\n5. Ejecutando pruebas de errores esperados...');
  
  // 5a. Empresa inexistente
  const unexistentCompanyId = 9999999;
  try {
    console.log(`   - Intentando actualizar status de company_id ${unexistentCompanyId}...`);
    updateStatusUseCase.execute({
      companyId: unexistentCompanyId,
      status: 'entrevista',
    });
    console.error('   [FAIL] Debería haber lanzado CompanyNotFoundError');
  } catch (error) {
    if (error instanceof CompanyNotFoundError) {
      console.log(`   [OK] Se capturó correctamente CompanyNotFoundError: "${error.message}" (code: ${error.code})`);
    } else {
      console.error('   [FAIL] Se capturó un error inesperado:', error);
    }
  }

  // 5b. Estado inválido
  try {
    console.log('   - Intentando asignar status inválido ("estado_inexistente")...');
    updateStatusUseCase.execute({
      companyId: company.id,
      status: 'estado_inexistente',
    });
    console.error('   [FAIL] Debería haber lanzado InvalidStatusError');
  } catch (error) {
    if (error instanceof InvalidStatusError) {
      console.log(`   [OK] Se capturó correctamente InvalidStatusError: "${error.message}" (code: ${error.code})`);
    } else {
      console.error('   [FAIL] Se capturó un error inesperado:', error);
    }
  }

  console.log('\n=== PRUEBA MANUAL FINALIZADA CON ÉXITO ===');
}

runTest().catch((err) => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
