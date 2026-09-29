#!/usr/bin/env node
/**
 * Generates src/Skeleton.css.
 *
 *   npm run css
 *
 * Two layers of rules:
 *
 * 1. Attribute rules. On the client, the component classifies every element
 *    inside a loading skeleton once (src/utils/marks.ts) and marks it with
 *    data-skx="t|f|e|b|c". These rules are simple attribute selectors, so
 *    style recalculation stays cheap even for thousands of elements.
 *
 * 2. Fallback rules. Server-rendered HTML is shown before React runs, so the
 *    same classification is also expressed in CSS (:has() and friends). These
 *    rules only apply to roots without data-skx-ready, which the component
 *    sets as soon as it has classified a root.
 *
 * Selector lists shared by several rules are defined once below.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const j = (items) => items.join(', ');
const rule = (selectors, body) => `${[selectors].flat().join(',\n')} {${body}\n}`;

/* ---------------------------------------------------------------- scopes */

// Root and everything inside it.
const IN = ':where(.skx-loading, .skx-loading *)';
// Same, but only for roots the component has not classified yet (SSR).
const FB = ':where(.skx-loading:not([data-skx-ready]), .skx-loading:not([data-skx-ready]) *)';

/* ---------------------------------------------------------------- lists */

const KEEP = [
    '.skx-loading [data-skeleton="keep"]',
    '.skx-loading [data-skeleton="keep"] *',
    '.skx-loading .not-skeleton',
    '.skx-loading .not-skeleton *',
];
const NOT_KEEP = `:not(:where(${j(KEEP)}))`;
// Containers (elements that are not drawn as blocks) that keep their own
// borders / backgrounds with the `surfaces` option.
const CONTAINERS_OF = (...modes) => {
    const roots = modes.flatMap((m) => [`.skx-surfaces-${m}`, `.skx-surfaces-${m} *`]);
    // Wrapped in :where() so these rules keep zero specificity.
    return `:where(:where(${j(roots)}):not([data-skx], [data-skx] *))`;
};
const KEEPS_BORDERS = CONTAINERS_OF('outlined', 'visible');
const KEEPS_FILL = CONTAINERS_OF('visible');

// Ancestors of kept content (set by JS) keep their text colour.
const KEEP_PATH = '[data-skx-keep-path]';

const PHRASING = 'br, wbr, b, i, u, s, strong, em, small, mark, sub, sup, code, kbd, abbr, time, q, cite, var, samp, del, ins';
// Elements whose element children are only inline formatting tags.
const TEXT_CONTAINER = `:not(:has(> :not(${PHRASING})))`;
const TEXT_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'figcaption', 'legend', 'caption', 'summary', 'dt'];
const LINE_MARKERS = ['.sk-line', '[data-skeleton="line"]'];
const TEXTISH = [...TEXT_TAGS, ...LINE_MARKERS, TEXT_CONTAINER];

const BLOCKS = [
    'img', 'svg',
    'input:not([type="hidden"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"])',
    'textarea', 'select', 'button',
    '.sk-block', '.sk-circle', '.sk-rect', '.sk-pill', '[data-skeleton="block"]',
];
const COVERED = [
    'input:is([type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"])',
    'progress', 'meter', 'canvas', 'iframe', 'embed', 'object', 'audio', 'video',
];
const PAINT_CONTAINERS = [...TEXT_TAGS, ...LINE_MARKERS, 'button', 'select', 'textarea', 'svg', '.sk-block', '.sk-circle', '.sk-rect', '.sk-pill', '[data-skeleton="block"]'];
const INSIDE_PAINTED = [`${IN}:where(${j(PAINT_CONTAINERS)}) *`, `${IN}${TEXT_CONTAINER} > *`];
const NON_VISUAL = [
    'br', 'wbr', 'option', 'optgroup', 'script', 'style', 'template', 'noscript', 'source', 'track', 'area', 'param',
    'col', 'colgroup', 'datalist', 'slot', 'link', 'meta', 'title', 'base', 'map',
    'skx-keep', 'skx-ignore', 'skx-unite', '.skx-wrapper',
];
const IGNORED_INSIDE = '.skx-loading [data-skeleton="ignore"] *';
const FILLABLE = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'li', 'td', 'th', 'dd', 'dt', 'figcaption', 'caption', 'blockquote'];
const FILL_TEXT = '"\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0\\a0"';

// Solid blocks: container mode and <SkeletonUnite>.
const SOLID = [
    '.skx-loading.skx-container:not(.skx-wrapper)',
    '.skx-loading.skx-container.skx-wrapper > *',
    '.skx-loading skx-unite > *',
    '.skx-loading [data-skeleton="unite"]:not(skx-unite)',
];
const SOLID_INSIDE = SOLID.map((s) => `${s} *`);

/* ---------------------------------------------------------------- bodies */

const PAINT_STATIC = `
    background-color: var(--skx-_base) !important;
    background-image: var(--skx-_image, none) !important;
    background-size: 200% 100% !important;
    background-repeat: no-repeat !important;`;
const ANIMATE = `
    animation: var(--skx-_anim, none) !important;
    animation-delay: var(--skx-delay, 0s) !important;`;
const PAINT = PAINT_STATIC + ANIMATE;

const LINES = 'repeating-linear-gradient(to bottom, transparent 0 var(--skx-_gap), #000 var(--skx-_gap) calc(1lh - var(--skx-_gap)), transparent calc(1lh - var(--skx-_gap)) 1lh)';
const TEXT_BODY = `
    background-clip: content-box !important;
    -webkit-mask-image: ${LINES};
    mask-image: ${LINES};
    -webkit-mask-origin: content-box;
    mask-origin: content-box;`;

// The outline reaches 2px past the box (clipped away), so anti-aliased
// edge pixels never show the content underneath.
const COVER = `
    outline: calc(100vmax + 2px) solid var(--skx-_base) !important;
    outline-offset: -100vmax !important;
    clip-path: inset(0) !important;
    animation: var(--skx-_anim, none) !important;
    animation-delay: var(--skx-delay, 0s) !important;`;

const T = '[data-skx="t"]';
// A transparent 1x1 GIF: replaces the missing/broken-image frame.
const BLANK_IMAGE = 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")';
const F = '[data-skx="f"]';

/* ---------------------------------------------------------------- css */

const css = `/*
 * react-skeletonix - generated by scripts/build-css.mjs, do not edit by hand.
 *
 * The component puts \`skx-loading\` on a "root": either the wrapped element
 * itself or a \`display: contents\` wrapper.
 */

/* ---- Structural helpers ---- */

${rule(['.skx-wrapper', 'skx-keep', 'skx-ignore', 'skx-unite'], `
    display: contents !important;`)}

/* ---- Tokens ----
 * Public: --skx-base-color, --skx-highlight-color, --skx-duration,
 * --skx-border-radius, --skx-line-gap. The 1.0 --skeletonify-* variables are
 * still read as fallbacks. */

.skx-loading {
    --skx-_base: var(--skx-base-color, var(--skeletonify-base-color, var(--skx-scheme-base, #f0f0f0)));
    --skx-_highlight: var(--skx-highlight-color, var(--skeletonify-highlight-color, var(--skx-scheme-highlight, #fcfcfc)));
    --skx-_duration: var(--skx-duration, var(--skeletonify-duration, 1.5s));
    --skx-_radius: var(--skx-border-radius, var(--skeletonify-border-radius, 4px));
    --skx-_gap: var(--skx-line-gap, 0.18em);
}

.skx-scheme-dark {
    --skx-scheme-base: #2a2a2e;
    --skx-scheme-highlight: #3a3a40;
}

@media (prefers-color-scheme: dark) {
    .skx-scheme-auto {
        --skx-scheme-base: #2a2a2e;
        --skx-scheme-highlight: #3a3a40;
    }
}

.skx-animate.skx-v-shimmer {
    --skx-_image: linear-gradient(90deg, var(--skx-_base) 30%, var(--skx-_highlight) 50%, var(--skx-_base) 70%);
    --skx-_anim: skx-shimmer var(--skx-_duration) linear infinite;
}

.skx-animate.skx-v-wave {
    --skx-_image: linear-gradient(110deg, var(--skx-_base) 35%, var(--skx-_highlight) 50%, var(--skx-_base) 65%);
    --skx-_anim: skx-wave var(--skx-_duration) ease-in-out infinite;
}

.skx-animate.skx-v-pulse {
    --skx-_anim: skx-pulse var(--skx-_duration) ease-in-out infinite;
}

.skx-animate.skx-v-blink {
    --skx-_anim: skx-blink var(--skx-_duration) steps(1, end) infinite;
}

@media (prefers-reduced-motion: reduce) {
    .skx-loading {
        --skx-_anim: none !important;
        --skx-_image: none !important;
    }
}

/* ---- 1. Reset: hide real visuals, keep the exact layout ---- */

${rule(`${IN}${NOT_KEEP}`, `
    text-shadow: none !important;
    outline-color: transparent !important;
    caret-color: transparent !important;
    text-decoration-color: transparent !important;
    user-select: none !important;
    pointer-events: none !important;`)}

/* Card/panel surfaces. surfaces="outlined" keeps the borders of containers,
   surfaces="visible" also keeps their backgrounds and shadows. */
${rule(`${IN}${NOT_KEEP}:not(${KEEPS_BORDERS})`, `
    border-color: transparent !important;`)}

${rule(`${IN}${NOT_KEEP}:not(${KEEPS_FILL})`, `
    background-color: transparent !important;
    background-image: none !important;
    box-shadow: none !important;`)}

/* Text colour is inherited, so ancestors of kept content keep theirs
   (marked by JS; :has() only before hydration). */
${rule(`${IN}:not(:where(${j(KEEP)}, ${KEEP_PATH}, ${FB}:has([data-skeleton="keep"], .not-skeleton)))`, `
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;`)}

${rule(`${IN}${NOT_KEEP}::placeholder`, `
    color: transparent !important;`)}

${rule([`${IN}${NOT_KEEP}::before`, `${IN}${NOT_KEEP}::after`], `
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    border-color: transparent !important;
    background: transparent !important;
    box-shadow: none !important;`)}

${rule(`${IN}${NOT_KEEP}::file-selector-button`, `
    visibility: hidden;`)}

/* Media: push the pixels out of the box so only the block shows. */
${rule(['.skx-loading img', '.skx-loading video', 'img.skx-loading', 'video.skx-loading'].map((s) => `${s}${NOT_KEEP}`), `
    object-position: -99999px -99999px !important;`)}

/* ---- 2. Classified elements (client) ---- */

${rule(['[data-skx="t"]', '[data-skx="f"]', '[data-skx="e"]', '[data-skx="b"]', '[data-skx="i"]', `:where(${j(SOLID)})`], PAINT_STATIC)}

/* Animation is only declared while animating (cheaper static skeletons). */
${rule([':where([data-skx="t"], [data-skx="f"], [data-skx="e"], [data-skx="b"], [data-skx="i"]):where(.skx-animate *)', `:where(${j(SOLID)}):where(.skx-animate, .skx-animate *)`], ANIMATE)}

/* Text: content box only, one bar per line (needs the lh unit; older
   browsers keep a single block). */
${rule([T, F], TEXT_BODY)}

/* Images without pixels (no src yet, or failed): no broken-image frame. */
${rule(['[data-skx="i"]', `img:is(:not([src]), [src=""])${FB}`], `
    content: ${BLANK_IMAGE} !important;`)}

/* Empty text still shows a line while its data is undefined. */
${rule(`${F}::after`, `
    content: ${FILL_TEXT};`)}

/* Canvas, frames and native controls draw over their background: cover
   them with an inset outline clipped to the box. */
${rule('[data-skx="c"]', COVER)}

/* Loose text next to block-level children (set by JS with the CSS Custom
   Highlight API, no DOM changes). */
::highlight(skx-text) {
    background-color: var(--skx-_base, #f0f0f0);
    color: transparent;
}

/* Children of a painted block (icons, checkboxes in labels...). */
${rule('[data-skx] > *', `
    visibility: hidden !important;`)}

/* ---- 3. Fallback detection (server-rendered HTML before hydration) ---- */

${rule(`${FB}:where(${j([...BLOCKS, ...TEXTISH])}):not(:where(${j([...NON_VISUAL, ...KEEP, IGNORED_INSIDE, ...INSIDE_PAINTED])}))`, PAINT)}

${rule(`${FB}:where(${j([...TEXT_TAGS, ...LINE_MARKERS])}, ${TEXT_CONTAINER}:not(:empty)):not(:where(${j([...SOLID, ...KEEP])}))`, TEXT_BODY)}

${rule(`${FB}:where(${j(FILLABLE)}):empty:not(:where([class*="icon"], ${j(KEEP)}, .skx-no-fill, .skx-no-fill *))::after`, `
    content: ${FILL_TEXT};`)}

${rule(`${FB}:where(${j(COVERED)}):not(:where(${j([...KEEP, IGNORED_INSIDE, ...INSIDE_PAINTED, ...SOLID_INSIDE])}))`, COVER)}

${rule([`${FB}:where(${j(INSIDE_PAINTED)}):where(${j(COVERED)})${NOT_KEEP}`, `${FB}:where(svg *)${NOT_KEEP}`], `
    visibility: hidden !important;`)}

@supports not selector(:has(*)) {
${rule(`${FB}:where(span, a, li, td, th, dd, b, strong, i, em, small, code, div:empty):not(:where(${j([...KEEP, IGNORED_INSIDE, `.skx-loading :where(${j([...TEXT_TAGS, 'button', 'span', 'a'])}) *`])}))`, `${PAINT}
    border-radius: var(--skx-_radius);`)}
}

/* ---- 4. Shapes ---- */

/* Corner radius in a cascade layer, so any author border-radius wins. */
@layer skx {
${rule('[data-skx]', `
    border-radius: var(--skx-_radius);`)}

${rule(`${FB}:where(${j([...TEXTISH, 'img', 'video', 'input', 'textarea', 'select', 'button', '.sk-block', '.sk-rect', '[data-skeleton="block"]'])})`, `
    border-radius: var(--skx-_radius);`)}
}

${rule(['.skx-loading .sk-circle', '.skx-loading.sk-circle'], `
    border-radius: 50% !important;`)}

${rule(['.skx-loading .sk-rect', '.skx-loading.sk-rect'], `
    border-radius: 4px !important;`)}

${rule(['.skx-loading .sk-pill', '.skx-loading.sk-pill'], `
    border-radius: 9999px !important;`)}

${rule(['.skx-circle', '.skx-circle *'], `
    border-radius: 50% !important;`)}

/* ---- 5. Control markers ---- */

${rule(['.skx-loading[data-skeleton="ignore"]', '.skx-loading [data-skeleton="ignore"]', IGNORED_INSIDE, ...SOLID_INSIDE], `
    visibility: hidden !important;`)}

/* ---- 6. Random line widths: three deterministic widths cycled ---- */

${[['', 'w1'], [':nth-child(3n + 2)', 'w2'], [':nth-child(3n)', 'w3']].map(([nth, w]) => rule(
    `:where(.skx-random, .skx-random *):where(p, h1, h2, h3, h4, h5, h6, li, .sk-line, [data-skeleton="line"], div${T}, div${F}, div${TEXT_CONTAINER}${FB})${nth}`,
    `
    width: var(--skx-${w}, 100%) !important;${nth ? '' : `
    max-width: 100% !important;`}`)).join('\n\n')}

/* ---- 7. Keyframes ---- */

@keyframes skx-shimmer {
    from {
        background-position: 150% 0;
    }

    to {
        background-position: -50% 0;
    }
}

@keyframes skx-wave {
    from {
        background-position: -50% 0;
    }

    to {
        background-position: 150% 0;
    }
}

@keyframes skx-pulse {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@keyframes skx-blink {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.2;
    }
}
`;

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/Skeleton.css');
writeFileSync(out, css);
console.log(`wrote ${out} (${(css.length / 1024).toFixed(1)} kB)`);
