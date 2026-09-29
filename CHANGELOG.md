# Changelog

## 1.1.0

### Fixed
- Skeletons now render when the child is a single element (e.g. `<h4>`), for text inside `div`/`a`/`td`/`span`, and for images (previously blank).
- Components with hooks, class components, `memo` and `forwardRef` no longer crash or show real content.
- `data` passed as a single object no longer crashes.
- Loaded state renders the children untouched: no leftover wrapper, classes or attributes.
- `lazy` works with render-function children and pauses when scrolled out of view.
- `showWrapper={false}` no longer adds a `div` for component children, so it is safe inside `<tbody>`, `<ul>` and `<select>`.
- The CSS no longer changes layout (display, width, min sizes) and no longer styles generic classes such as `.icon`, `.avatar` or `.line`.
- `.not-skeleton` protects its whole subtree; `excludeSelector` only affects its own skeleton.
- `randomWidth` is stable between renders and on SSR.
- Forwarded refs point to the skeleton root; a child's own ref is kept; user keys are kept.
- `id` and event handlers are no longer duplicated across `count` copies.

### Added
- Complex UI support: multi-line text becomes one bar per line; empty text still shows a line (`fillEmpty`), also in plain `div`/`span` elements; text mixed with icons/inline elements is one line; text next to form fields or blocks (`<label>Name <input/></label>`) gets its own bar via the CSS Custom Highlight API; video, canvas, iframes, checkboxes, radios, sliders, colour/file inputs, `progress` and `meter` become solid blocks; bare text children become an inline line.
- `useSkeleton()` hook and `SkeletonScope` (for portals).
- `lazy` now animates only the copies in the viewport.
- Faster on large skeletons: elements are classified once by a DOM pass and styled with simple attribute rules (CSS-only detection remains for SSR before hydration).
- A single element child is no longer remounted when loading ends (state and effects are kept).
- `colorScheme` (`light` / `dark` / `auto`), `placeholderData`.
- `SkeletonTheme` accepts every option and can be nested.
- `SkeletonKeep`, `SkeletonIgnore`, `SkeletonUnite`, `exceptTags`, `exceptTagGroups` work in every mode.
- `data-skeleton="keep|ignore|unite|block|line"` attributes.
- `inert` + `aria-busy` while loading; `prefers-reduced-motion` support.
- `'use client'` banner for Next.js App Router.
- Exported types: `SkeletonProps`, `SkeletonOptions`, `SkeletonThemeProps`, `SkeletonVariant`, `SkeletonColorScheme`, `HtmlTagGroup`.
- ES, CommonJS and UMD builds with matching type declarations; `react-skeletonix/style.css` export.

### Changed
- `useAST` is deprecated and has no effect.
- `Skeleton` accepts `HTMLDivElement` refs as in 1.0.x (typed `Ref<HTMLElement> | Ref<HTMLDivElement>`).
- CSS classes and variables use the `skx-` prefix (`--skeletonify-*` variables are still read).
- JS bundle no longer includes a copy of `react/jsx-runtime`; React stays external.
