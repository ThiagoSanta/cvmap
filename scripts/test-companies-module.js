import { createCompany } from '../src/modules/companies/domain/company.entity.js';
import { SqliteCompanyRepository } from '../src/modules/companies/infrastructure/sqlite-company.repository.js';
import { CacheCompaniesUseCase } from '../src/modules/companies/application/cache-companies.usecase.js';
import { SearchCompaniesUseCase } from '../src/modules/companies/application/search-companies.usecase.js';
import { ValidationError, OverpassError } from '../src/shared/errors/errors.js';

async function runTests() {
  console.log('--- TEST 1: Validación de Entidad Company ---');
  try {
    const validComp = createCompany({
      osm_id: 'node/1001',
      name: 'Empresa de Prueba',
      latitude: -32.823,
      longitude: -61.390,
    });
    console.log('✓ Entidad válida creada correctamente:', validComp.toJSON().name);
  } catch (err) {
    console.error('❌ Error inesperado creando entidad válida:', err);
    process.exit(1);
  }

  try {
    createCompany({
      osm_id: '',
      name: 'Empresa Inválida',
      latitude: -32.823,
      longitude: -61.390,
    });
    console.error('❌ Falló: no lanzó ValidationError con osm_id vacío');
    process.exit(1);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log('✓ Capturado correctamente ValidationError por osm_id vacío:', err.message);
    } else {
      console.error('❌ Error inesperado:', err);
      process.exit(1);
    }
  }

  console.log('\n--- TEST 2: Transformación y Persistencia (CacheCompaniesUseCase & SqliteCompanyRepository) ---');
  const repo = new SqliteCompanyRepository();
  const cacheUseCase = new CacheCompaniesUseCase(repo);

  const mockOverpassElements = [
    {
      type: 'node',
      id: 999001,
      lat: -32.823,
      lon: -61.390,
      tags: {
        shop: 'bakery',
        phone: '+54 3471 123456',
        'addr:street': 'San Martín',
        'addr:housenumber': '100',
      },
    },
    {
      type: 'way',
      id: 999002,
      center: { lat: -32.824, lon: -61.391 },
      tags: {
        name: 'Fábrica San José',
        industrial: 'factory',
      },
    },
  ];

  const cachedResult = cacheUseCase.execute(mockOverpassElements);
  console.log(`✓ ${cachedResult.length} empresas procesadas y persistidas desde elementos mock:`);
  console.log('  - Muestra fallback (name ausente -> categoría):', {
    osm_id: cachedResult[0].osm_id,
    name: cachedResult[0].name,
    category: cachedResult[0].category,
    address: cachedResult[0].address,
  });
  console.log('  - Muestra normal (con name):', {
    osm_id: cachedResult[1].osm_id,
    name: cachedResult[1].name,
    category: cachedResult[1].category,
  });

  console.log('\n--- TEST 3: Búsqueda en Caché SQLite (SearchCompaniesUseCase) ---');
  const searchUseCase = new SearchCompaniesUseCase(repo, cacheUseCase);
  const testCity = 'Cañada de Gómez';

  const startTimeCache = Date.now();
  const cacheResult = await searchUseCase.execute({ city: testCity, radius: 10000 });
  const durationCache = Date.now() - startTimeCache;

  console.log(`✓ Recuperación desde caché completada en ${durationCache}ms:`);
  console.log(`  - Ciudad: ${cacheResult.city}`);
  console.log(`  - Cantidad de empresas cacheadas: ${cacheResult.count}`);

  if (cacheResult.count < 2) {
    console.error('❌ Error: Se esperaban al menos 2 empresas cacheadas en la zona.');
    process.exit(1);
  }

  console.log('\n--- TEST 4: Prueba de Conexión Live con Overpass API (Ubicación No Cacheada) ---');
  try {
    const freshCity = 'Rosario';
    console.log(`Consultando ciudad externa sin caché previo: "${freshCity}"...`);
    const startTimeLive = Date.now();
    const liveResult = await searchUseCase.execute({ city: freshCity, radius: 15000 });
    const durationLive = Date.now() - startTimeLive;

    console.log(`✓ Respuesta live recibida de Overpass en ${durationLive}ms:`);
    console.log(`  - Ciudad: ${liveResult.city}`);
    console.log(`  - Empresas obtenidas: ${liveResult.count}`);
  } catch (err) {
    if (err instanceof OverpassError) {
      console.log('⚠️ Overpass API pública no está disponible en este momento (504/Timeout).');
      console.log('✓ La jerarquía de errores manejó correctamente la caída devolviendo OverpassError (502).');
    } else {
      console.error('❌ Error no esperado durante prueba live:', err);
      process.exit(1);
    }
  }

  console.log('\n--- TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE ---');
}

runTests().catch((err) => {
  console.error('\n❌ ERROR CRÍTICO EN TEST RUNNER:', err);
  process.exit(1);
});
