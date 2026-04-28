## Drilling Operator App

Aplicación web para facilitar registro de turnos y barrenos en campo. Objetivo: reducir errores de captura y acelerar reporte diario de productividad (metros perforados, operarios, ubicación, voladuras).

Público objetivo

- Supervisores y operadores de perforación que registran turno y datos por barreno.

Problema que resuelve

- Simplifica entrada repetitiva de datos en terreno, asegura trazabilidad (correcciones con `updatedAt`/`updatedBy`) y exportación de reportes por día.

Tecnologías y arquitectura

- Frontend: React + Vite + Tailwind CSS (componentizado).
- Backend/Realtime: Supabase (Postgres + realtime).
- Diseño: Clean Architecture / ports-and-adapters pattern — `core/entities` + repository interfaces + infrastructure adapters (`src/infrastructure/*`).
- Dependencias relevantes: `supabase-js`, `xlsx` (export), browser Intl APIs for fecha/hora.

Principales responsabilidades del código

- Capturar shift header (datos de turno) y barrenos repetitivos.
- Persistir en DB (holes, shifts), soportar correcciones supervisores con auditoría.
- Subscriptions realtime para actualizar dashboard supervisor.
- Exportar informes XLSX por fecha.

Estructura clave (puntos de interés para reviewer)

Calidad y patrones

- Inyección de dependencias para facilitar pruebas/mocks (repositorios y managers).
- Separación de responsabilidades: mapeos DB ↔ domain en repositorios; UI solo formatea para visualización.
- Consideraciones de timezone: app estandariza uso `America/Bogota` en formato visual; consultas diarias se filtran por campo `date` en DB.
- Manejo de estado Offline: app guarda datos localmente si no hay conexión, sincroniza al reconectar.
