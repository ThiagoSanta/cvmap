# Límites conocidos — CVMap

Este documento aplica tanto para uso técnico (desarrollo, auditoría del código) como para comunicarle al usuario final qué esperar de la app. Las limitaciones acá descritas son de la fuente de datos (OpenStreetMap / Overpass API), no bugs del sistema.

## Cobertura desigual según la zona

OpenStreetMap depende de contribuciones voluntarias. Ciudades grandes suelen tener buena cobertura de empresas cargadas; ciudades chicas o zonas rurales pueden tener muy pocos registros o ninguno.

**Validado con datos reales (21/07/2026):** una consulta de prueba sobre Cañada de Gómez (bbox ~15km) devolvió 20 resultados entre comercios, talleres y oficinas. La cobertura alcanza para que el proyecto tenga sentido en esta zona, pero confirma los siguientes patrones:

- Algunos registros están completos (nombre, dirección, teléfono, web, horario) — ej: organismos públicos y empresas grandes con presencia de marca.
- La mayoría están parciales o mínimos (solo nombre + categoría, sin contacto).
- Existen registros **sin nombre**, identificados únicamente por su categoría (ej: `office=lawyer` sin `name`). La aplicación debe manejar este caso mostrando la categoría como fallback en vez de dejar el campo vacío o mostrar un valor nulo.

**De cara al usuario:** un resultado con pocas o ninguna empresa no significa que la app esté fallando — significa que esa zona tiene poca cobertura en OpenStreetMap.

## Datos incompletos

Muchas empresas en OSM tienen solamente el nombre cargado, sin teléfono, dirección, sitio web, horario ni categoría. La app muestra únicamente los campos que existan; los campos vacíos no implican error.

## Información desactualizada

OSM puede tener datos de empresas que ya cerraron, cambiaron de dirección, de teléfono o de nombre. La app refleja lo que exista en la base de OSM al momento de la consulta/caché, no necesariamente el estado real actual del negocio.

## Categorías inconsistentes

Una misma actividad puede estar etiquetada de formas distintas en OSM (ej: una metalúrgica como `industrial`, `factory`, `manufacturer`, `company` o `workshop`), o directamente sin categoría. Por decisión de diseño (ver `decisions.md`), estas categorías no se normalizan en el MVP, por lo que el usuario puede ver rubros similares agrupados bajo etiquetas distintas.

## Límites de la API de Overpass

Overpass es una API pública compartida, con límites de consultas simultáneas y posibilidad de respuestas lentas o caídas temporales. Se mitiga cacheando resultados en SQLite (ver `decisions.md`), pero la primera consulta sobre una zona nueva sigue dependiendo de la disponibilidad de Overpass en ese momento.

### Timeouts en ciudades grandes y densas

En ciudades grandes y con alta densidad de datos en OSM (ej: Rosario, Córdoba, Buenos Aires), los radios de búsqueda amplios pueden generar consultas demasiado pesadas para que Overpass las resuelva dentro del timeout configurado.

**Hallazgo validado con datos reales (22/07/2026) — Rosario, Argentina:**

| Radio | Resultado | Tiempo |
|-------|-----------|--------|
| 1 000 m | Timeout 504 en ambos servidores | — |
| 5 000 m | 2 014 elementos | ~7.3 s |
| 10 000 m | 2 638 elementos | ~17.5 s (al límite) |
| 15 000 m | Timeout 504 en ambos servidores | — |

**Causa:** No es un bug de la aplicación. Es una limitación de la fuente de datos pública: el volumen de elementos OSM en zonas densas supera la capacidad de respuesta de los servidores públicos de Overpass dentro del tiempo límite.

**Mitigaciones implementadas:**
- El timeout HTTP del cliente es configurable vía `OVERPASS_TIMEOUT_MS` en `.env` (por defecto: 60 s, antes 25 s).
- El timeout declarado en la query QL se deriva automáticamente del mismo valor.
- El cliente detecta respuestas parciales con `remark` de tipo "timeout" (HTTP 200 pero datos incompletos) y las trata como error, intentando con servidores de fallback antes de lanzar `OverpassError`.

**Para el usuario final:** si la consulta sobre una ciudad grande agota el tiempo de espera, la app devuelve un error claro. Reducir el radio de búsqueda suele resolver el problema.

## La app no reemplaza la búsqueda laboral tradicional

CVMap ayuda a organizar el envío de CVs a empresas de una zona geográfica, pero no muestra ofertas de empleo activas ni reemplaza portales de trabajo, LinkedIn o la búsqueda directa en sitios de empresas. Encontrar una empresa en el mapa no significa que esté contratando.

