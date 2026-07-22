import { geocodeCity } from '../src/config/nominatim-client.js';
import { fetchCompaniesAround } from '../src/config/overpass-client.js';
import { db } from '../src/config/database.js';
import { envConfig } from '../src/config/env.js';

async function runTest() {
  console.log('====================================================');
  console.log(' CVMap — Test de Infraestructura Externa (Fase 1)');
  console.log('====================================================\n');

  try {
    // 1. Probar conexión e inicialización de SQLite
    console.log('[1/4] Verificando base de datos SQLite...');
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((row) => row.name);
    console.log(`✓ Conexión SQLite exitosa. Tablas detectadas: ${tables.join(', ')}\n`);

    // 2. Geocodificar ciudad con Nominatim
    const cityName = 'Cañada de Gómez';
    console.log(`[2/4] Consultando Nominatim para geocodificar "${cityName}"...`);
    const geoResult = await geocodeCity(cityName);

    console.log('✓ Respuesta de Nominatim:');
    console.log(`  - Ciudad: ${geoResult.cityName}`);
    console.log(`  - Coordenadas: Lat ${geoResult.latitude}, Lon ${geoResult.longitude}`);
    console.log(`  - Nombre descriptivo: ${geoResult.displayName}\n`);

    // 3. Consultar Overpass API
    const radius = envConfig.business.defaultSearchRadius;
    console.log(`[3/4] Consultando Overpass API para un radio de ${radius / 1000} km alrededor de ${cityName}...`);
    
    const startTime = Date.now();
    const overpassRawData = await fetchCompaniesAround(geoResult.latitude, geoResult.longitude, radius);
    const duration = Date.now() - startTime;

    const elements = overpassRawData.elements || [];
    console.log(`✓ Respuesta de Overpass recibida en ${duration}ms:`);
    console.log(`  - Total de elementos/empresas obtenidas: ${elements.length}\n`);

    // 4. Mostrar resumen de los primeros resultados
    console.log('[4/4] Muestra de los primeros 5 resultados recuperados:');
    elements.slice(0, 5).forEach((item, index) => {
      const tags = item.tags || {};
      const name = tags.name || tags['brand'] || '(Sin nombre)';
      const category = tags.office || tags.shop || tags.craft || tags.industrial || 'otra';
      const lat = item.lat || item.center?.lat;
      const lon = item.lon || item.center?.lon;

      console.log(`  ${index + 1}. [${item.type}/${item.id}] ${name}`);
      console.log(`     - Categoría: ${category}`);
      console.log(`     - Ubicación: (${lat}, ${lon})`);
      if (tags['addr:street']) {
        console.log(`     - Dirección: ${tags['addr:street']} ${tags['addr:housenumber'] || ''}`);
      }
    });

    console.log('\n====================================================');
    console.log(' STATUS: PRUEBA DE INFRAESTRUCTURA FINALIZADA CON ÉXITO');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA DE INFRAESTRUCTURA:');
    console.error(`- Tipo: ${error.name} (${error.code || 'UNKNOWN'})`);
    console.error(`- Mensaje: ${error.message}`);
    if (error.attemptsDetails) {
      console.error('- Detalle de intentos fallidos en Overpass:', error.attemptsDetails);
    }
    process.exit(1);
  } finally {
    db.close();
  }
}

runTest();
