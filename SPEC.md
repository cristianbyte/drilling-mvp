# App Spec

## Objetivo

Aplicacion web para operacion de perforacion y carga en campo. Meta: capturar datos de turno, barrenos y carga con soporte offline, sincronizacion posterior y vistas supervisoras para seguimiento y exportacion.

## Stack actual

- Frontend: React 19 + Vite.
- Routing: `react-router-dom`.
- Estilos: Tailwind CSS.
- Persistencia remota: Supabase.
- Persistencia local offline: IndexedDB via `idb`.
- Exportacion: `xlsx`.
- PWA: `vite-plugin-pwa`.

## Regla de tooling

- Usar solo `pnpm` para instalar, correr scripts y gestionar dependencias.
- No usar `npm`, `yarn` ni `bun` en comandos de proyecto.

## Rutas actuales

- `/`: entrada/login fake.
- `/perforacion`: captura operativa de perforacion.
- `/carga`: captura operativa de carga.
- `/supervisor/perforacion`: vista supervisor de perforacion.
- `/supervisor/carga`: vista supervisor de carga.

## Arquitectura actual

- `src/view/*`: pantallas/rutas.
- `src/components/*`: piezas UI reutilizables.
- `src/lib/*`: utilidades cliente, offline store, ids, fechas, export.
- `src/di/container.js`: composicion e inyeccion de repositorios.
- `src/infrastructure/supabase/*`: adapters hacia Supabase.
- `src/core/*`: entidades e interfaces de dominio.

Patron actual:

- UI en vistas/componentes.
- Acceso a datos via repositorios inyectados.
- Mapeo DB/domain dentro de infrastructure.
- Estado offline centralizado en `src/lib/offlineStore.js`.

## Principios funcionales

- App debe funcionar con y sin conexion.
- Captura local no debe depender de disponibilidad inmediata de Supabase.
- Registros pendientes deben poder sincronizarse luego.
- Cambios locales de una vista no deben romper flujo de otra vista.
- Supervisor debe poder consultar estado consolidado sin depender de estado local de operador.

## Persistencia offline

`src/lib/offlineStore.js` es fuente unica para IndexedDB.

Responsabilidades:

- guardar snapshots de vistas;
- guardar records pendientes de sync;
- marcar records synced/pending;
- limpiar estado local por vista.

Regla:

- Vistas no deben duplicar logica de borrado o filtrado de IndexedDB.
- Vistas solo limpian estado React local y delegan persistencia a helper comun.

## Independencia de vistas

`perforacion` y `carga` son flujos separados.

- Reset de `perforacion` limpia solo snapshot y records de `perforacion`.
- Reset de `carga` limpia solo snapshot y records de `carga`.
- Reset nunca debe borrar datos remotos en Supabase.
- Reset de una vista no debe tocar estado local ni cola pending de otra vista.

Scopes actuales:

- `perforacion`: snapshot `operator-form`, records `shift` + `hole`.
- `carga`: snapshot `carga-form`, records `carga-context` + `carga-hole`.

## Regla de limpieza de codigo

- Funcion reemplazada debe ser eliminada.
- Codigo sin uso debe ser removido en mismo cambio.
- No dejar helpers legacy si nueva funcion ya cubre caso.
- No dejar imports muertos, estados muertos, props muertas ni ramas obsoletas.

Ejemplo valido:

- Si `clearLocalViewState(view)` reemplaza `clearAllRecords()`, `clearAllRecords()` debe eliminarse.

## Criterios para cambios

- Preferir cambio minimo correcto.
- Mantener nombres y patrones ya usados en repo cuando sirvan.
- No duplicar logica ya centralizada.
- Si se introduce nueva capacidad transversal, definir punto unico de verdad.

## Criterios de aceptacion generales

- Flujo de perforacion funciona y conserva sync offline.
- Flujo de carga funciona y conserva sync offline.
- Resets locales son independientes.
- No queda codigo muerto luego de reemplazo.
- Build compila sin errores.
