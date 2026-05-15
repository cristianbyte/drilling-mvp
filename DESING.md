# DESIGN.md — forecast-api

Panel de supervisión industrial para contratistas de minería.
Especificacion exclusiva para diseño en la vista de SUPERVISOR.
Light theme. Datos densos. Sin decoración superflua.

---

## 1. Identidad Visual

**Carácter:** panel de control industrial. Serio, denso, legible.
Sin gradientes. Sin sombras decorativas. Sin animaciones llamativas.
Cada píxel justificado por información.

**Fuente única:** `Geist Mono` — medium (500) y bold (700). Nada más.
Uso de monospace refuerza la naturaleza técnica del panel y alinea columnas numéricas de forma natural.

---

## 2. Tokens de Diseño

### CSS Variables

```css
:root {
  /* Tipografía */
  --font-base: "Geist Mono", monospace;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Colores primarios */
  --color-brand: #f97316; /* naranja minería — acción, alerta activa, selección */
  --color-brand-dim: #ffe8d5; /* naranja suave — bg de estado activo, badges */

  /* Colores de apoyo */
  --color-ok: #10b981; /* verde — valores dentro de rango, confirmado */
  --color-ok-dim: #d1fae5;
  --color-danger: #dc2626; /* rojo — diferencias fuera de rango, errores */
  --color-danger-dim: #fee2e2;
  --color-info: #0ea5e9; /* azul frío — turno noche, sync, estado live */
  --color-info-dim: #e0f2fe;

  /* Superficies */
  --surface-base: #f4f6f8; /* fondo app */
  --surface-1: #ffffff; /* cards, paneles */
  --surface-2: #e5e7eb; /* hover */
  --surface-3: #d1d5db; /* pressed, dividers fuertes */

  /* Bordes */
  --border-subtle: #e5e7eb;
  --border-default: #d1d5db;
  --border-strong: #9ca3af;

  /* Texto */
  --text-primary: #111827;
  --text-muted: #4b5563;
  --text-faint: #9ca3af;

  /* Radios */
  --radius-card: 0.75rem;
  --radius-input: 0.375rem;
  --radius-btn: 0.5rem;
  --radius-pill: 9999px;
}
```

### Tailwind Config

```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      mono: ["Geist Mono", "monospace"],
    },
    fontWeight: {
      medium: "500",
      bold: "700",
    },
    colors: {
      brand:   { DEFAULT: "#f97316", dim: "#ffe8d5" },
      ok:      { DEFAULT: "#10b981", dim: "#d1fae5" },
      danger:  { DEFAULT: "#dc2626", dim: "#fee2e2" },
      info:    { DEFAULT: "#0ea5e9", dim: "#e0f2fe" },
      surface: { base: "#f4f6f8", 1: "#ffffff", 2: "#e5e7eb", 3: "#d1d5db" },
      border:  { subtle: "#e5e7eb", default: "#d1d5db", strong: "#9ca3af" },
      text:    { primary: "#111827", muted: "#4b5563", faint: "#9ca3af" },
    },
    borderRadius: {
      card:  "0.75rem",
      input: "0.375rem",
      btn:   "0.5rem",
    },
  },
}
```

---

## 3. Tipografía

| Uso               | Peso   | Tamaño  | Color        |
| ----------------- | ------ | ------- | ------------ |
| Título de sección | bold   | 11px    | text-primary |
| Label de campo    | medium | 11px    | text-muted   |
| Valor numérico    | bold   | 14–16px | text-primary |
| Valor secundario  | medium | 12px    | text-muted   |
| Badge / pill      | bold   | 10px    | contextual   |
| Header de tabla   | bold   | 10px    | text-faint   |
| Fila de tabla     | medium | 12–13px | text-primary |

Todo en mayúsculas para labels y headers de tabla (`uppercase tracking-widest`).
Valores numéricos en case normal para legibilidad.

---

## 4. Layout

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR  — nombre módulo + indicador live + acciones │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  PANEL PRINCIPAL                      │
│  lista de    │  ┌──────────────────────────────────┐ │
│  entidades   │  │  KPI STRIP (métricas clave)      │ │
│  (scroll)    │  ├──────────────────────────────────┤ │
│              │  │  TABLA DE DETALLE                │ │
│              │  │  (densa, scroll vertical)        │ │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar: `w-64`, fijo, fondo `surface-1`, borde derecho `border-default`.
- Panel principal: fondo `surface-base`, padding `p-6`.
- KPI strip: fila de cards horizontales, fondo `surface-1`, borde `border-subtle`.
- Tabla: fondo `surface-1`, sin zebra-striping. Hover en `surface-2`.

---

## 5. Componentes

### Card KPI

```
┌────────────────────┐
│ LABEL              │  ← 10px bold uppercase text-faint
│ 4 475.7            │  ← 24px bold text-primary
│ metros totales     │  ← 11px medium text-muted
└────────────────────┘
```

- Fondo: `surface-1`
- Borde: `border border-subtle rounded-card`
- Sin sombra.

### Badge de Estado

```
● ACTIVA     → bg-brand-dim   text-brand   border-brand/30
● BILLED     → bg-ok-dim      text-ok      border-ok/30
● DRAFT      → bg-surface-2   text-muted   border-default
```

- Siempre `rounded-pill`, `text-[10px] font-bold uppercase tracking-wider`.
- El punto `●` indica estado vivo.

### Badge Turno

```
DÍA    → bg-brand-dim  text-brand  font-bold
NOCHE  → bg-info-dim   text-info   font-bold
```

### Chip de Diferencia (columna DIFERENCIA en tabla)

```
+4.2% / +0.4   → verde  si dentro de tolerancia
-2.6% / -0.3   → rojo   si fuera de tolerancia
+0.0% / +0.0   → gris   si neutral
```

- `rounded-input`, `px-2 py-0.5`, `text-[11px] font-bold`.
- Fondo semitransparente del color semántico (`-dim`).

### Tabla de Datos

```
HEADER ROW: bg-surface-base, text-faint, 10px bold uppercase, border-b border-default
DATA ROW:   bg-surface-1, text-primary, 12px medium, border-b border-subtle
HOVER ROW:  bg-surface-2
```

- Sin bordes laterales en celdas.
- Columnas numéricas: `text-right font-bold`.
- Columnas de identificador (barreno): `text-brand font-bold` — clickeable.
- Padding celda: `px-4 py-2.5`.

### Input / Select

```
border border-default rounded-input bg-surface-1
text-primary text-[13px] font-medium
focus:border-brand focus:ring-1 focus:ring-brand/30
```

### Botón Primario

```
bg-brand text-white font-bold rounded-btn px-4 py-2 text-[12px] uppercase tracking-wide
hover:bg-orange-600
```

### Botón Secundario / Ghost

```
border border-default text-text-muted font-medium rounded-btn px-4 py-2 text-[12px]
hover:bg-surface-2
```

---

## 6. Uso de Color — Reglas

| Color          | Cuándo usarlo                                                                |
| -------------- | ---------------------------------------------------------------------------- |
| `brand`        | Selección activa en sidebar, identificadores clickeables, acciones primarias |
| `ok`           | Estado CONFIRMED/BILLED, diferencias dentro de rango, sync exitoso           |
| `danger`       | Diferencias fuera de tolerancia, errores, estado crítico                     |
| `info`         | Turno noche, indicador live, datos provenientes de sistema externo           |
| `text-faint`   | Headers de tabla, labels secundarios — nunca valores                         |
| `surface-base` | Solo fondo de app — nunca para cards o componentes                           |

**Regla de oro:** si un número es positivo no significa que sea verde. El color semántico depende del contexto de negocio (diferencia dentro/fuera de tolerancia, no el signo matemático).

---

## 7. Indicadores Especiales

### Live Indicator

```html
<span
  class="inline-flex items-center gap-1.5 text-ok text-[11px] font-bold uppercase tracking-widest"
>
  <span class="w-1.5 h-1.5 rounded-full bg-ok animate-pulse"></span>
  EN VIVO
</span>
```

### Sync Timestamp

```
Act. 12:37:10  →  text-faint text-[10px] font-medium
```

---

## 8. Lo que NO hacer

- No usar `font-light` ni `font-regular` — solo `medium` y `bold`.
- No usar sombras (`shadow-*`) en cards de datos — solo bordes.
- No usar colores fuera de los tokens definidos.
- No usar fuentes distintas a Geist Mono.
- No usar dark mode — light theme siempre.
- No usar gradientes.
- No usar `rounded-xl` o `rounded-2xl` — máximo `rounded-card` (0.75rem).
- No truncar valores numéricos con `…` — escalar columna o reducir tamaño.
