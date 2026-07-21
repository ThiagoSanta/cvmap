# Decisiones técnicas — CVMap

## Fuente de datos: Overpass API (OpenStreetMap)

Se eligió Overpass API por ser gratuita, abierta y no requerir clave de API para uso básico. Es la fuente de datos geográficos más accesible para un proyecto de portfolio de este tamaño.

**Trade-off aceptado:** la cobertura y completitud de datos varía mucho según la zona — ver `known-limitations.md`.

## Caché en SQLite (no consulta en vivo)

Los resultados de Overpass se guardan en SQLite en vez de consultarse en cada búsqueda, por dos motivos:

1. **Rate limits:** Overpass es una API pública compartida, con límites de consultas agresivos. Sin caché, el desarrollo iterativo (probar y recargar constantemente) generaría bloqueos temporales.
2. **Performance:** las consultas a Overpass pueden ser lentas; cachear reduce el tiempo de respuesta en búsquedas repetidas sobre la misma zona.

**Expiración del caché:** 30 días. Pasado ese tiempo, una búsqueda sobre una zona ya cacheada vuelve a consultar Overpass y actualiza los registros. Es un valor configurable (`config/env.js`), no hardcodeado.

## Base de datos: SQLite (`better-sqlite3`)

Se eligió SQLite por sobre un motor cliente-servidor (Postgres, MySQL) porque:

- El proyecto es de un solo usuario, sin necesidad de concurrencia real.
- No requiere infraestructura adicional (servidor de base de datos separado).
- `better-sqlite3` es síncrono, lo cual simplifica el código en un proyecto de este tamaño (sin manejo de promesas/callbacks para cada query).

## Arquitectura por dominio (no por capa técnica)

El proyecto se organiza en módulos de negocio (`companies`, `tracking`) en vez de por tipo técnico (`controllers/`, `models/`, `services/`).

**Motivo:** alta cohesión — todo lo relacionado a una funcionalidad vive junto, facilitando el mantenimiento y permitiendo que un módulo se pueda eliminar o extraer sin efecto dominó en el resto del sistema.

`companies` y `tracking` se mantienen como módulos separados (no fusionados) porque tienen ciclos de vida distintos: `companies` se alimenta de una fuente externa (Overpass) y se cachea automáticamente; `tracking` es contenido que el usuario gestiona manualmente. Esta separación permite, por ejemplo, que `companies` funcione de forma independiente como buscador aunque `tracking` no exista.

## Sin autenticación de usuarios

El MVP es de un solo usuario, sin sistema de login. No hay tabla de usuarios en el modelo de datos. Autenticación queda fuera de alcance del MVP; se evaluaría solo si el proyecto evoluciona hacia multi-usuario (ver funcionalidades futuras en la idea original del proyecto).

## Categorías sin normalizar (por ahora)

Las categorías de empresa (`category` en `companies`) se guardan tal cual vienen de OSM, sin una tabla de normalización propia. Se decidió así para no sumar complejidad al MVP; se evaluaría normalizar en una fase posterior si la inconsistencia de categorías afecta la usabilidad de los filtros.

## Identificación de empresas por `osm_id`

Cada empresa se identifica de forma única por su `osm_id` (no por nombre ni coordenadas), para evitar duplicados cuando dos búsquedas de zonas geográficas superpuestas traen la misma empresa dos veces.
