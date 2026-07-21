# CVMap

Buscador de empresas en mapa para organizar el envío de CVs y hacer seguimiento de tu búsqueda laboral.

## ¿Qué hace?

CVMap te permite buscar una ciudad y un radio de distancia, y te muestra en un mapa interactivo las empresas y negocios cercanos obtenidos de OpenStreetMap. Sobre esa lista podés llevar el seguimiento de tu búsqueda de empleo puerta a puerta: marcar el estado de cada empresa (pendiente, CV enviado, respondió, entrevista, rechazado), agregar notas y visualizar de un vistazo qué zonas ya cubriste.

## Stack técnico

- **Backend:** Node.js + Express
- **Base de datos:** SQLite (`better-sqlite3`)
- **Frontend:** HTML, CSS, JavaScript, Leaflet
- **Fuente de datos geográficos:** Overpass API (OpenStreetMap)
- **Gestor de paquetes:** pnpm

## Instalación local

Requisitos: Node.js 18+ y pnpm.

```powershell
git clone https://github.com/ThiagoSanta/cvmap.git
cd cvmap
pnpm install
pnpm approve-builds
```

Copiá el archivo de variables de entorno de ejemplo y completá lo que corresponda:

```powershell
copy .env.example .env
```

Levantá el proyecto en modo desarrollo (con recarga automática):

```powershell
pnpm dev
```

O en modo producción:

```powershell
pnpm start
```

## Estado actual

🚧 En desarrollo — estructura base del proyecto y dependencias configuradas. Aún no hay funcionalidades implementadas.

## Estructura del proyecto

cvmap/
├── src/ # Backend: config, módulos de negocio (companies, tracking)
├── public/ # Frontend estático (HTML, CSS, JS, Leaflet)
├── database/ # Esquema y base de datos SQLite
└── docs/ # Documentación del proyecto (modelo de datos, decisiones, límites, changelog)

## Documentación

Más detalle en la carpeta [`docs/`](./docs):

- [Modelo de datos](./docs/data-model.md)
- [Decisiones técnicas](./docs/decisions.md)
- [Límites conocidos](./docs/known-limitations.md)
- [Changelog](./docs/changelog.md)

## Licencia

Este proyecto está bajo licencia MIT. Ver [LICENSE](./LICENSE) para más detalle.
