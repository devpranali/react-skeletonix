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
- CSS classes and variables use the `skx-` prefix (`--skeletonify-*` variables are still read).
- JS bundle no longer includes `react/jsx-runtime` (~35% smaller).
