# Modelo de datos — CVMap

## Entidades

### `companies`

Empresas obtenidas y cacheadas desde Overpass API (OpenStreetMap).

| Campo         | Tipo     | Descripción                                                                             |
| ------------- | -------- | --------------------------------------------------------------------------------------- |
| id            | INTEGER  | PK interna, autoincremental                                                             |
| osm_id        | TEXT     | ID único de OpenStreetMap — evita duplicados entre búsquedas de zonas superpuestas      |
| name          | TEXT     | Nombre de la empresa                                                                    |
| address       | TEXT     | Dirección (si existe en OSM)                                                            |
| phone         | TEXT     | Teléfono (si existe en OSM)                                                             |
| website       | TEXT     | Sitio web (si existe en OSM)                                                            |
| opening_hours | TEXT     | Horarios (si existe en OSM)                                                             |
| category      | TEXT     | Rubro/categoría, tal como viene de OSM (sin normalizar por ahora)                       |
| latitude      | REAL     | Coordenada                                                                              |
| longitude     | REAL     | Coordenada                                                                              |
| cached_at     | DATETIME | Fecha en que se guardó/actualizó el registro — usado para expiración de caché (30 días) |

`osm_id` tiene restricción `UNIQUE` para evitar duplicados cuando dos búsquedas de radios distintos se superponen geográficamente.

### `tracking`

Estado de seguimiento del usuario sobre una empresa puntual.

| Campo      | Tipo     | Descripción                                                 |
| ---------- | -------- | ----------------------------------------------------------- |
| id         | INTEGER  | PK interna, autoincremental                                 |
| company_id | INTEGER  | FK → `companies.id`                                         |
| status     | TEXT     | pendiente / cv_enviado / respondio / entrevista / rechazado |
| updated_at | DATETIME | Última actualización del estado                             |

Relación 1 a 1 con `companies` — cada empresa tiene un único registro de seguimiento activo, que se actualiza (no se duplica) cuando cambia el estado.

### `tracking_events`

Historial de eventos con fecha, para soportar múltiples envíos de CV u otros hitos sobre la misma empresa a lo largo del tiempo.

| Campo      | Tipo     | Descripción                                 |
| ---------- | -------- | ------------------------------------------- |
| id         | INTEGER  | PK interna, autoincremental                 |
| company_id | INTEGER  | FK → `companies.id`                         |
| event_type | TEXT     | cv_enviado / respuesta / entrevista / otro  |
| event_date | DATE     | Fecha del evento                            |
| note       | TEXT     | Nota libre asociada a ese evento (opcional) |
| created_at | DATETIME | Fecha de creación del registro              |

Esta tabla es la que resuelve tu necesidad de manejar varias fechas y varias notas por empresa (ej: "enviaste el CV dos veces en fechas distintas"): cada envío es un evento nuevo, no se pisa el anterior.

## Relaciones

companies (1) ──── (1) tracking
companies (1) ──── (N) tracking_events

## Notas de diseño

- No hay tabla de categorías normalizadas: se decidió mostrar `category` tal cual viene de OSM, ver `decisions.md` punto correspondiente.
- No hay tabla de usuarios: el sistema es de un solo usuario, sin login, ver `decisions.md`.
- El campo `note` vive en `tracking_events` y no en `tracking`, porque cada nota/evento necesita su propia fecha — un campo de nota simple en `tracking` no hubiera soportado múltiples envíos con fechas distintas.
