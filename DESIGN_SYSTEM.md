# Sistema de diseño — Clínica Montalvo

Esta es la fuente de verdad del diseño visual del software. No es una guía
de estilo aspiracional: cada valor documentado aquí existe como código en
`src/styles/`. Si algo en la UI no coincide con este documento, el bug está
en la UI, no en el documento.

**Regla de oro:** ningún componente escribe un color, tamaño, radio, sombra
o tiempo de animación "a mano". Todo se consume desde las variables CSS
definidas en `src/styles/_tokens.scss`. Si un valor que necesitás no existe
todavía, se agrega ahí — nunca se hardcodea localmente.

## 1. Origen de marca

Basado en el Tablero de Marca Clínica Montalvo:

| Uso                | Color         | Hex       |
|--------------------|---------------|-----------|
| Verde oscuro       | Primario      | `#006156` |
| Verde claro / teal | Secundario    | `#39ADA3` |
| Blanco             | Neutro        | `#FFFFFF` |
| Negro              | Neutro        | `#000000` |

Código de imprenta (offset/CMYK) del primario: C:100 M:9 Y:58 K:45 — solo
relevante para piezas impresas, no para pantalla.

Tipografías de marca: **Bufalo** (script decorativo, para titulares de
marketing/impresos) y una sans geométrica en negrita para el wordmark
"MONTALVO". Ver sección 3 para cómo se tradujeron a la interfaz.

**El logo se deja vacío intencionalmente.** No hay ningún archivo de marca
en el repo todavía. Cuando lo tengas:
- Ícono de pestaña: reemplazá `public/favicon.ico` (múltiplos de 16/32/48px).
- Logo en la app: agregalo como SVG en `public/` (versión a color sobre
  fondo claro y una versión monocromática en blanco para fondos oscuros/
  `--color-primary`).

## 2. Color

### 2.1 Escalas

Las escalas de primario y secundario se generaron mezclando el color de
marca hacia blanco (tints 50–400) y hacia negro (shades 600–900); `500` es
el valor de marca exacto. La escala neutra corre de `0` (blanco puro) a
`1000` (negro puro), pasando por un `900` casi negro (`#151A19`) que se usa
como color de texto por defecto — más cómodo de leer en pantalla que negro
puro, que queda reservado como constante de marca/impresión.

Nunca uses `--color-primary-500`, `--color-neutral-900`, etc. directamente
en un componente de producto: son la materia prima. Los **alias
semánticos** (sección 2.2) son la API pública.

### 2.2 Alias semánticos (usar estos)

| Variable | Valor | Uso |
|---|---|---|
| `--color-surface` | blanco | Fondo de página/tarjetas |
| `--color-surface-subtle` | gris ~F7F9F9 | Fondos de sección alternos |
| `--color-surface-muted` | gris ~EEF2F1 | Fondos de inputs deshabilitados, filas alternas |
| `--color-border` / `--color-border-strong` | grises claros | Bordes de tarjetas/inputs |
| `--color-text` | casi negro | Texto por defecto |
| `--color-text-muted` | gris medio | Texto secundario/ayuda |
| `--color-primary` / `-hover` / `-active` | verde oscuro | Acción principal, marca |
| `--color-on-primary` | blanco | Texto/ícono sobre `--color-primary` |
| `--color-secondary` / `-hover` / `-active` | teal | Acciones secundarias, acentos, superficies destacadas |
| `--color-on-secondary` | casi negro | Texto/ícono sobre `--color-secondary` (**nunca blanco**, ver 2.3) |
| `--color-accent-text` | teal oscuro (700) | Links/acentos como texto sobre blanco |
| `--color-focus-ring` | verde oscuro | Único anillo de foco del sistema |
| `--color-success` / `-subtle` / `-on-success` | verde distinto de marca | Confirmaciones, estados OK |
| `--color-warning` / `-subtle` / `-on-warning` | ámbar oscuro | Advertencias |
| `--color-danger` / `-subtle` / `-on-danger` | rojo | Errores, acciones destructivas |
| `--color-info` / `-subtle` / `-on-info` | azul | Mensajes informativos |

Los estados (`success`/`warning`/`danger`/`info`) usan tonos **distintos**
del verde de marca a propósito: un toast de "guardado con éxito" no debe
poder confundirse visualmente con un botón de acción primaria.

### 2.3 Contraste — verificado, no asumido

Cada combinación texto/fondo de este sistema fue medida contra WCAG 2.2
(fórmula de luminancia relativa), no elegida a ojo:

- `--color-primary` sobre blanco / blanco sobre `--color-primary`: **7.4:1**
  (pasa AAA). Es el color más seguro del sistema para texto y botones.
- `--color-secondary` (teal `#39ADA3`) sobre blanco: **2.7:1** — **no pasa
  AA**. Por eso `--color-on-secondary` es texto oscuro, no blanco, y por
  qué el teal base no se usa como color de texto sobre fondos claros.
- `--color-accent-text` (teal-700, `#297D75`) sobre blanco: **4.9:1** —
  pasa AA. Es la variante de teal segura para links/texto.
- `--color-secondary` con texto oscuro encima: **7.7:1** — combinación
  correcta para superficies/badges en teal.
- `success` / `warning` / `danger` / `info` sobre blanco (y con texto
  blanco encima): todos ≥ 5.3:1 — pasan AA con margen.

Regla práctica: si vas a poner texto sobre un fondo de color, usá el par
`--color-{x}` + `--color-on-{x}` ya definido. No inventes combinaciones
nuevas sin volver a medir el contraste.

## 3. Tipografía

- `--font-body` → **Inter** (con fallback a system-ui). Texto de
  interfaz, párrafos, formularios, tablas. Elegida por legibilidad a
  tamaños pequeños — crítico en un sistema clínico con mucha lectura de
  datos.
- `--font-heading` → **Poppins** (con fallback a `--font-body`). Sans
  geométrica en negrita, cercana a las formas del wordmark "MONTALVO" del
  logo. Se usa en `h1`–`h6` vía `src/styles/_base.scss`.
- `--font-accent` → **Bufalo** (script de marca). Reservada para
  titulares de piezas de marketing/redes/impresos — **nunca** para texto
  de interfaz, formularios o cuerpo de contenido: una tipografía script
  falla los mínimos de legibilidad/accesibilidad a tamaños de UI. Ver
  `public/fonts/README.md` para activarla cuando tengas los archivos de la
  fuente licenciada.

Inter y Poppins se cargan por Google Fonts en `src/index.html`. Si el
proyecto necesita funcionar sin conexión a internet en producción,
migrarlas a `@font-face` local siguiendo el mismo patrón que el bloque
comentado de Bufalo en `_tokens.scss`.

Escala tipográfica (`--font-size-xs` a `--font-size-5xl`), pesos
(`--font-weight-regular` a `-bold`), interlineados (`--line-height-tight`
a `-relaxed`) y tracking: todos en `_tokens.scss`, con comentarios de su
tamaño en px junto a cada valor en rem.

## 4. Espaciado, radios, sombras, movimiento

- **Espaciado**: escala de base 4px, de `--space-1` (4px) a `--space-9`
  (96px). Usar siempre estas variables para padding/margin/gap.
- **Radios**: `--radius-sm` (6px) a `--radius-xl` (20px), más
  `--radius-full` para píldoras/avatares. Deliberadamente modestos — el
  estilo es minimalista y clínico, no lúdico.
- **Sombras**: `--shadow-sm/md/lg`, todas de bajo contraste. Este sistema
  favorece bordes (`--color-border`) sobre sombras pesadas para separar
  superficies.
- **Movimiento**: `--duration-fast/base/slow` (120/200/320ms) y
  `--ease-standard`/`--ease-emphasized`. `prefers-reduced-motion` ya está
  respetado globalmente en `_reset.scss` — no hay que repetirlo por
  componente.
- **Z-index**: capas nombradas (`--z-dropdown`, `--z-modal`, etc.) en vez
  de números mágicos sueltos en cada componente.

## 5. Layout y breakpoints

Los breakpoints (`sm` 480 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536)
viven como valores de Sass en `src/styles/_settings.scss` (no como CSS
custom properties, porque una media query no puede leer una variable CSS
en tiempo de ejecución). Se consumen así desde cualquier componente:

```scss
@use 'mixins' as m;

.card {
  padding: var(--space-4);

  @include m.respond-to('md') {
    padding: var(--space-6);
  }
}
```

Gracias a `stylePreprocessorOptions.includePaths` en `angular.json`, calls
como `@use 'mixins' as m;` funcionan desde cualquier profundidad de
carpeta sin rutas relativas (`../../../styles/mixins`).

`.container` (en `_utilities.scss`) centra contenido con
`--container-max` (1200px) y padding lateral `--container-padding`.

## 6. Accesibilidad — no negociable

El `CLAUDE.md` del proyecto ya exige pasar AXE y cumplir WCAG AA. Este
sistema de diseño está construido para que cumplirlo sea el camino de
menor esfuerzo, no una capa extra:

- Un solo anillo de foco (`:focus-visible` en `_base.scss`, mixin
  `m.focus-ring`) — no lo remuevas ni lo reemplaces por componente sin un
  reemplazo visible equivalente.
- Contraste verificado por par color-sobre-color (sección 2.3).
- `prefers-reduced-motion` respetado globalmente.
- `.skip-link` y `.visually-hidden` listos en `_utilities.scss` para
  navegación por teclado/lectores de pantalla en el layout que agregues.
- `NgOptimizedImage` para imágenes estáticas (regla ya en `CLAUDE.md`).

## 7. Cómo se construyen los componentes

`src/app/shared/ui/button/` es el componente de referencia: standalone,
`input()`/signals, estilos 100% basados en tokens, variantes tipadas
(`ButtonVariant`, `ButtonSize`). Nuevos primitivos de UI (`ui-input`,
`ui-card`, `ui-badge`, etc.) deberían seguir el mismo patrón:

1. Selector con prefijo `ui-` en `src/app/shared/ui/<nombre>/`.
2. Variantes como *type* + `input()`, nunca clases sueltas sin tipar.
3. Un único archivo `.scss` que solo usa `var(--...)` y los mixins de
   `styles/mixins`.
4. Estados (`disabled`, `loading`, `invalid`) resueltos con `computed()`,
   no con lógica repetida en la plantilla.

## 8. Modo oscuro (a futuro)

Los tokens están organizados para soportarlo, pero **no está activado
todavía**: activar un tema oscuro sin revisar cada combinación de
contraste sería peor que no tenerlo. Cuando se priorice, agregar los
valores oscuros revisados como un bloque `[data-theme="dark"]` en
`_tokens.scss` (y opcionalmente un `@media (prefers-color-scheme: dark)`
protegido por `:root:not([data-theme="light"])`), nunca activarlo "gratis"
solo por preferencia de sistema operativo sin pasar cada par de contraste
por la sección 2.3 primero.

## 9. Archivos de este sistema

```
src/styles/
  _settings.scss   // breakpoints (Sass, no genera CSS)
  _mixins.scss     // respond-to, focus-ring, visually-hidden, truncate
  _tokens.scss     // ★ toda variable CSS del sistema — la fuente de verdad
  _reset.scss      // reset moderno mínimo
  _base.scss       // estilos base de elementos HTML, usando tokens
  _utilities.scss  // .container, .stack, .cluster, .visually-hidden, .skip-link
src/styles.scss    // orquesta el orden: reset → tokens → base → utilities
src/app/shared/ui/button/   // componente de referencia
```
