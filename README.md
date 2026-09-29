# react-skeletonix

[![npm version](https://img.shields.io/npm/v/react-skeletonix.svg?style=flat-square)](https://www.npmjs.com/package/react-skeletonix)
[![npm downloads](https://img.shields.io/npm/dm/react-skeletonix.svg?style=flat-square)](https://www.npmjs.com/package/react-skeletonix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-skeletonix?style=flat-square)](https://bundlephobia.com/package/react-skeletonix)

**[👉 Full Documentation & Live Demo](https://doc.react-skeletonix.devpranali.com/)**

**Wrap any component and get its skeleton automatically.** `react-skeletonix` masks your *real* UI while it loads: text becomes grey lines, images, buttons and inputs become blocks, and the layout stays exactly the same. No separate skeleton components to design or keep in sync.

- 🧠 **Automatic**: works on plain HTML, your own components, class components, `memo`, `forwardRef` and third-party components
- 📐 **Layout-safe**: no size or display changes; wrappers are `display: contents`
- 🎨 **Themeable**: shimmer, pulse, wave, blink or static; light/dark/auto colours; CSS variables
- ♿ **Accessible**: loading content is `inert` and `aria-busy`, and respects `prefers-reduced-motion`
- ⚡ **Tiny**: ~4 kB JS + ~1.5 kB CSS gzipped, zero dependencies, React 16.8 – 19, SSR / Next.js ready

## Installation

```bash
npm install react-skeletonix
```

Import the stylesheet once, e.g. in `main.tsx` or your root layout:

```tsx
import 'react-skeletonix/style.css';
```

## Quick start

```tsx
import Skeleton from 'react-skeletonix';

function ProfileCard({ loading, user }) {
  return (
    <Skeleton loading={loading}>
      <div className="card">
        <img className="avatar" src={user?.avatar} alt="" />
        <h3>{user?.name ?? 'Placeholder name'}</h3>
        <p>{user?.bio ?? 'A short placeholder bio that fills one line.'}</p>
        <button>Follow</button>
      </div>
    </Skeleton>
  );
}
```

While `loading` is `true` the card is rendered with its real layout, and every piece of content becomes a skeleton block. When `loading` is `false` the children are rendered untouched: no wrapper, no extra attributes.

> **Tip:** placeholder text gives a line its width. An element with no text and no size has nothing to show, so give empty placeholders a size (`width`/`height`) or some placeholder text.

## Lists and render functions

Pass a function as `children` to render a list. While loading it is called `count` times with `placeholderData` (or `null`); afterwards it is called for each item of `data`.

```tsx
<Skeleton<Movie> loading={loading} data={movies} count={6}>
  {(movie) => (
    <article className="movie-card">
      <img src={movie?.poster} alt="" />
      <h3>{movie?.title ?? 'Loading title'}</h3>
      <span>{movie?.year ?? '2024'}</span>
    </article>
  )}
</Skeleton>
```

`data` also accepts a single object. Keys you set in the render function are kept.

## How blocks are chosen

| Element | While loading |
| :--- | :--- |
| Text: `p`, `h1`–`h6`, `label`, and any element that only contains text (e.g. `<div>John</div>`, `<a>`, `<td>`, `<span>`) | One rounded line block (padding is not painted) |
| `img`, `video`, `svg`, `input`, `textarea`, `select`, `button`, `progress`, `meter` | A block of the same size and shape |
| Empty elements with a size (e.g. an avatar `div`) | A block; your `border-radius` is kept |
| Layout containers (cards, rows, grids) | Invisible background/border; layout unchanged |
| `canvas`, `iframe`, `embed`, `object`, `audio` | Hidden (space kept) |

## Controlling the output

```tsx
import Skeleton, { SkeletonKeep, SkeletonIgnore, SkeletonUnite } from 'react-skeletonix';

<Skeleton loading={loading}>
  <div className="toolbar">
    <SkeletonKeep><Logo /></SkeletonKeep>              {/* shown as-is */}
    <SkeletonIgnore><Badge /></SkeletonIgnore>         {/* invisible, keeps its space */}
    <SkeletonUnite><Chart /></SkeletonUnite>           {/* one solid block */}
    <h2>Dashboard</h2>
  </div>
</Skeleton>
```

The same works without components, on any element:

| Attribute / class | Effect |
| :--- | :--- |
| `data-skeleton="keep"` or `.not-skeleton` | Shown as-is, including its children |
| `data-skeleton="ignore"` | Hidden while loading, space kept |
| `data-skeleton="unite"` | One solid block |
| `data-skeleton="block"` / `.sk-block` | Force a block |
| `data-skeleton="line"` / `.sk-line` | Force a text line |
| `.sk-circle`, `.sk-pill`, `.sk-rect` | Force a shape |

Or by selector, scoped to one skeleton (also applies inside child components):

```tsx
<Skeleton loading={loading} exceptTags={['button']} excludeSelector=".badge">
  <Toolbar />
</Skeleton>
```

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`loading`** | `boolean` | required | Show the skeleton (`true`) or the real content (`false`). |
| `children` | `ReactNode \| (item, index) => ReactNode` | | Content to mask, or a render function. |
| `data` | `T[] \| T` | | Items for the render function once loaded. |
| `placeholderData` | `T` | `null` | Item passed to the render function while loading. |
| `count` | `number` | `1` | Number of skeleton copies while loading. |
| `variant` | `'shimmer' \| 'pulse' \| 'wave' \| 'blink' \| 'none'` | `'shimmer'` | Animation style. |
| `animate` | `boolean` | `true` | `false` renders static blocks. |
| `duration` | `number` | `1.5` | Animation length in seconds. |
| `stagger` | `boolean \| number` | `true` | Delay between copies (`true` = `0.1`s). |
| `lazy` | `boolean` | `false` | Only animate while in the viewport. |
| `baseColor` | `string` | `#ebebeb` | Block colour. |
| `highlightColor` | `string` | `#f5f5f5` | Shimmer/wave highlight colour. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Default colours; `auto` follows the OS. |
| `borderRadius` | `number \| string` | `4px` | Radius of text lines. |
| `circle` | `boolean` | `false` | Render every block as a circle. |
| `container` | `boolean` | `false` | Render each wrapped element as one solid block. |
| `randomWidth` | `boolean \| [min, max]` | `false` | Vary text line widths (percent, stable between renders). |
| `showWrapper` | `boolean` | `true` | See [Tables and lists](#tables-lists-and-selects). |
| `exceptTags` | `string[]` | | Tags shown as-is, e.g. `['button']`. |
| `exceptTagGroups` | `HtmlTagGroup[]` | | Groups shown as-is: `TEXT_TAGS`, `MEDIA_TAGS`, `FORM_TAGS`, `LIST_TAGS`, `TABLE_TAGS`, `STRUCTURE_TAGS`, `INTERACTIVE_TAGS`, `METADATA_TAGS`, `MISC_TAGS`. |
| `excludeSelector` | `string` | | Elements hidden while loading (space kept). |
| `className`, `style`, `id`, `on*`, … | | | Applied to the skeleton root while loading (first copy only for `id`/handlers). |

A ref is forwarded to the first skeleton root element.

## Theming

Set defaults for a whole app or section with `SkeletonTheme` (themes can be nested; props on `<Skeleton>` win):

```tsx
import { SkeletonTheme } from 'react-skeletonix';

<SkeletonTheme colorScheme="auto" variant="wave" duration={2}>
  <App />
</SkeletonTheme>
```

`SkeletonTheme` accepts every option from the props table except `loading`, `children`, `data` and `placeholderData`.

Or with CSS variables:

```css
:root {
  --skx-base-color: #e5e7eb;
  --skx-highlight-color: #f3f4f6;
  --skx-duration: 1.2s;
  --skx-border-radius: 6px;
}
```

## Tables, lists and selects

By default, children that are not a single HTML element are wrapped in a `<div style="display: contents">`. That is invisible to layout, but a `div` is not valid inside `<tbody>`, `<ul>` or `<select>`. There, use `showWrapper={false}`: no element is added, and the skeleton is applied to whatever your component renders.

```tsx
<tbody>
  <Skeleton loading={loading} data={rows} count={5} showWrapper={false}>
    {(row) => <OrderRow row={row} />}
  </Skeleton>
</tbody>
```

A single HTML element child (e.g. `<tr>…</tr>`) never gets a wrapper.

## Next.js and SSR

The bundle is marked `'use client'`, so it can be imported from Server Components. Skeleton markup renders on the server and hydrates without mismatches (`randomWidth` is deterministic).

## Accessibility

While loading, every skeleton root gets `aria-busy="true"` and `inert`: placeholder text is not announced, and nothing inside can be focused or clicked. Animations stop when the user prefers reduced motion.

## Browser support

All evergreen browsers. Automatic detection of text-only elements uses `:has()` (Chrome 105+, Safari 15.4+, Firefox 121+); older browsers fall back to a simpler tag-based rule.

**Known limitations**
- Loose text next to child elements in a generic container, e.g. `<div>Hello <span>you</span></div>`, is hidden rather than painted (only `span` gets a block). Wrap the text in its own element. Inline formatting tags are fine: `<div>Hello <b>you</b></div>` becomes one line.
- `canvas`, `iframe`, `embed` and `object` cannot be recoloured and are hidden while loading.
- A broken image with `alt` text may still show the browser's broken-image icon.
- Content kept with `SkeletonKeep` is visible but not interactive while loading (the skeleton is `inert`).

## Migrating from 1.0.x

- `useAST` is deprecated and does nothing: nested components are handled automatically in every mode, including components with hooks.
- `SkeletonKeep`, `SkeletonIgnore`, `SkeletonUnite`, `exceptTags` and `exceptTagGroups` now work without `useAST`.
- CSS classes and variables use the `skx-` prefix. The old `--skeletonify-*` variables are still read as fallbacks.
- When loaded, children are rendered without a wrapper; `className`/`style` only apply while loading.
- `data` is the loaded data. For dummy data while loading, use `placeholderData`.
- Import the stylesheet as `react-skeletonix/style.css` (the old `react-skeletonix/dist/style.css` path still works).

## Development

```bash
npm install
npm run check          # lint + typecheck + unit tests
npm run test:browser   # stylesheet checks in headless Chrome
npm run build
```

## License

MIT © Amit Kumar
