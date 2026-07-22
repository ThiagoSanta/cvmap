import { geocodeCity } from 'file:///c:/cvmap/src/config/nominatim-client.js';
import { fetchCompaniesFromOverpass } from 'file:///c:/cvmap/src/config/overpass-client.js';
import { calculateBoundingBox } from 'file:///c:/cvmap/src/shared/utils/geo-utils.js';

async function test() {
  console.log('Geocodificando Rosario...');
  const geo = await geocodeCity('Rosario');
  console.log('Geo Rosario:', geo);
  for (const r of [1000, 5000, 10000, 15000]) {
    const bbox = calculateBoundingBox(geo.latitude, geo.longitude, r);
    console.log(`\nProbando radio ${r}m... bbox:`, bbox.bboxString);
    try {
      const start = Date.now();
      const data = await fetchCompaniesFromOverpass(bbox.bboxString);
      const elapsed = Date.now() - start;
      console.log(`Radio ${r}m devolvió ${data.elements ? data.elements.length : 0} elementos en ${elapsed}ms`);
    } catch (err) {
      console.error(`Radio ${r}m error:`, err.message);
    }
  }
}
test();
