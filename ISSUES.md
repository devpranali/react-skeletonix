# react-skeletonix — Issue List

Audit of `src/` on branch `feat/lazy-loading-support` (commit `0cce275`), 2026-09-29.

## Resolution status

All issues below were addressed on a chain of branches, each built on the previous one:

1. `fix/css-masking-engine`
2. `fix/render-and-loaded-state`
3. `fix/remove-unsafe-ast-traversal`
4. `fix/lazy-theme-ssr`
5. `chore/package-optimization`

| ID | Issue | Branch | Status |
| :--- | :--- | :--- | :--- |
| SKX-01 | Single HTML element child not masked | `fix/css-masking-engine` | Fixed |
| SKX-02 | useAST does not skeletonize text | `fix/css-masking-engine`, `fix/remove-unsafe-ast-traversal` | Fixed (AST mode no longer needed) |
| SKX-03 | useAST crashes with hook components | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-04 | useAST crashes with class components | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-05 | useAST ignores memo/forwardRef | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-06 | `data` object crashes / meaning unclear | `fix/render-and-loaded-state` | Fixed (+ `placeholderData`) |
| SKX-07 | Images blank instead of grey | `fix/css-masking-engine` | Fixed |
| SKX-08 | Text in div/a/td disappears | `fix/css-masking-engine` | Fixed |
| SKX-09 | lazy never animates with render functions | `fix/lazy-theme-ssr` | Fixed |
| SKX-10 | Published build out of date | `chore/package-optimization` | Fixed after next publish |
| SKX-11 | randomWidth class left after loading | `fix/css-masking-engine`, `fix/render-and-loaded-state` | Fixed |
| SKX-12 | randomWidth changes every render | `fix/css-masking-engine` | Fixed |
| SKX-13 | Wrapper stays after loading | `fix/render-and-loaded-state` | Fixed |
| SKX-14 | useAST wrapper is a real div | `fix/render-and-loaded-state` | Fixed |
| SKX-15 | showWrapper={false} still adds a div | `fix/render-and-loaded-state` | Fixed |
| SKX-16 | CSS changes layout | `fix/css-masking-engine` | Fixed |
| SKX-17 | Empty spacer divs become blocks | `fix/css-masking-engine` | Improved: size kept; opt out with `data-skeleton="keep"` |
| SKX-18 | Generic/app-specific class names in CSS | `fix/css-masking-engine` | Fixed |
| SKX-19 | .not-skeleton does not protect children | `fix/css-masking-engine` | Fixed |
| SKX-20 | Control components only work with useAST | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-21 | useAST puts divs inside buttons | `fix/remove-unsafe-ast-traversal` | Fixed (traversal removed) |
| SKX-22 | excludeSelector style is global | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-23 | restProps duplicated on copies | `fix/render-and-loaded-state` | Fixed |
| SKX-24 | Loaded state drops className/style | `fix/render-and-loaded-state` | By design, documented: they style the skeleton root |
| SKX-25 | No `use client` | `fix/lazy-theme-ssr` | Fixed |
| SKX-26 | Hook after early return | `fix/render-and-loaded-state` | Fixed |
| SKX-27 | Forwarded ref not merged | `fix/render-and-loaded-state` | Fixed |
| SKX-28 | User keys overwritten | `fix/render-and-loaded-state` | Fixed |
| SKX-29 | AST traversal not memoized | `fix/remove-unsafe-ast-traversal` | Fixed (traversal removed) |
| SKX-30 | Theme covers few props | `fix/lazy-theme-ssr` | Fixed |
| SKX-31 | Identity check for control components | `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-32 | Dead code | `fix/css-masking-engine`, `fix/remove-unsafe-ast-traversal` | Fixed |
| SKX-33 | No prefers-reduced-motion | `fix/css-masking-engine` | Fixed |
| SKX-34 | Placeholder text read / focusable | `fix/render-and-loaded-state` | Fixed (`inert`) |
| SKX-35 | aria-live on every item | `fix/render-and-loaded-state` | Fixed |
| SKX-36 | No dark-mode defaults | `fix/css-masking-engine`, `fix/lazy-theme-ssr` | Fixed (`colorScheme`) |
| SKX-37 | Types not exported | `chore/package-optimization` | Fixed |
| SKX-38 | Peer dependency vs jsx-runtime | `chore/package-optimization` | Fixed (classic runtime, React external) |
| SKX-39 | package.json gaps | `chore/package-optimization` | Fixed |
| SKX-40 | skeletonify naming | `fix/css-masking-engine` | Fixed (`skx-`; old vars still read) |
| SKX-41 | README wrong/incomplete | `chore/package-optimization` | Fixed |
| SKX-42 | No tests, lint, CI | `chore/package-optimization` | Fixed (Vitest, headless-Chrome checks, ESLint, GitHub Actions) |

---

# Original audit

**Status legend**
- ✅ **Verified**: reproduced by running the code (SSR render with `react-dom/server`, plus headless Chrome with the real `Skeleton.css`).
- 🔍 **Code review**: found by reading the code, not reproduced yet.

**Severity:** 🔴 Critical (wrong output or crash in common usage) · 🟠 Major · 🟡 Minor · 📦 Packaging/Docs

---

## 🔴 Critical

### SKX-01: Skeleton does not appear when the child is a single HTML element ✅
`<Skeleton loading><h4>Title</h4></Skeleton>` puts `skeletonify-loading` **on the `<h4>` itself**. Every CSS rule is a descendant selector (`.skeletonify-loading :where(h1…)`), so nothing matches the element itself.
- **Result:** the text stays fully visible (`color: rgb(0,0,0)`) and no grey block appears.
- **Where:** [src/Skeleton.tsx:189-200](src/Skeleton.tsx#L189-L200), [src/Skeleton.tsx:148-158](src/Skeleton.tsx#L148-L158), [src/Skeleton.css:35-51](src/Skeleton.css#L35-L51)
- The same cause makes `randomWidth` do nothing on a single host child (measured 400px, expected 30%).

### SKX-02: `useAST` mode does not skeletonize text ✅
AST mode adds the classes to leaf elements (`<p class="skeletonify-loading …">`), and the descendant-only CSS never styles the leaf itself.
- **Result:** in AST mode the text stays visible. Only `SkeletonUnite` (container mode) produces a block.
- **Where:** [src/hooks/useAddSkeleton.tsx:58-62](src/hooks/useAddSkeleton.tsx#L58-L62), [src/utils/astHelpers.ts:13-26](src/utils/astHelpers.ts#L13-L26)

### SKX-03: `useAST` crashes with components that use hooks ✅
AST mode calls function components directly (`type(props)`), so their hooks run inside `Skeleton`'s render. When `loading` changes to `false`, React throws:
> Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
- **Where:** [src/hooks/useAddSkeleton.tsx:48-52](src/hooks/useAddSkeleton.tsx#L48-L52)

### SKX-04: `useAST` crashes with class components ✅
`TypeError: Class constructor X cannot be invoked without 'new'`, from the same code as SKX-03.

### SKX-05: `useAST` ignores `memo` and `forwardRef` components ✅
Their `type` is an object, not a function, so they are neither unpacked nor masked. `<Memo />` renders its real content during loading.

### SKX-06: `data` as an object crashes (and the README tells you to do this) ✅
The README Quick Start passes `data={{ name, bio }}`. When `loading` becomes `false`, it throws `TypeError: (data || []).map is not a function`.
- **Where:** [src/Skeleton.tsx:132](src/Skeleton.tsx#L132), [README.md:39](README.md#L39)
- **Related:** the README says `data` is dummy data *injected during loading*, but the code passes `null` during loading and uses `data` only **after** loading. Either the code or the docs need to change.

### SKX-07: Images render as empty space, not a grey block ✅
The media rule sets `visibility: hidden` together with a background colour, but `visibility: hidden` hides the background too. The parent isn't painted either.
- **Where:** [src/Skeleton.css:86-89](src/Skeleton.css#L86-L89)

### SKX-08: Text directly inside `div`, `a`, `td` and similar elements disappears ✅
`<div>John Doe</div>`, `<a>link</a>` and `<td>cell</td>` become transparent text with **no grey block**. `div` is only painted when it is `:empty`, and `a`, `td`, `th` and `select` aren't in the list at all.
- **Where:** [src/Skeleton.css:45](src/Skeleton.css#L45)

### SKX-09: `lazy` never animates with function children ✅
The ref is only attached in the plain-children path, so the `IntersectionObserver` is never created and `isVisible` stays `false`.
- **Where:** [src/Skeleton.tsx:129-175](src/Skeleton.tsx#L129-L175), [src/hooks/useIntersection.ts:15](src/hooks/useIntersection.ts#L15)

### SKX-10: Published build is out of date ✅
`dist/` was built on 2026-02-28 and is byte-identical to npm `1.0.2`. `Skeleton.tsx`, `Skeleton.css` and `useIntersection.ts` changed later, so `lazy` and `stagger` exist in neither `dist` nor npm.

---

## 🟠 Major

### SKX-11: `randomWidth` class stays on real content after loading ✅
Function-children path: `skeletonify-random-widths` has no `loading` check, so the loaded `<p>` keeps the class and nested text is forced to a random width.
- **Where:** [src/Skeleton.tsx:143](src/Skeleton.tsx#L143)

### SKX-12: `randomWidth` changes on every render ✅
`Math.random()` runs during render. Two renders gave `71%` and `86%`, so the skeleton flickers on re-render and causes an SSR hydration mismatch. It also gives one width for the whole skeleton, not one per line.
- **Where:** [src/Skeleton.tsx:102-108](src/Skeleton.tsx#L102-L108)

### SKX-13: Wrapper `div` stays after loading and breaks grid/flex ✅
After loading, function children are still wrapped in `<div class="skeletonify-wrapper">`. `display: contents` only applies together with `.skeletonify-loading`, so the wrapper becomes a real box.
- **Where:** [src/Skeleton.tsx:160-171](src/Skeleton.tsx#L160-L171), [src/Skeleton.css:19-21](src/Skeleton.css#L19-L21)

### SKX-14: `useAST` wrapper is a real `div` during loading ✅
In AST mode the wrapper gets `skeletonify-wrapper` but not `skeletonify-loading`, so `display: contents` never applies and an extra layout box appears.

### SKX-15: `showWrapper={false}` still adds a `div` for component children ✅
It only works when the child is a single HTML element. With `<Card />` it renders a real `<div>` (no longer `display: contents`), which is worse than the wrapper.
- **Where:** [src/Skeleton.tsx:189-214](src/Skeleton.tsx#L189-L214)

### SKX-16: CSS changes the layout ✅
The README claims "the real DOM layout is preserved", but the CSS changes it:
- `li` becomes `inline-block`, which breaks lists.
- `h1`–`h6` and `p` are forced to `display: block; width: 100%`.
- `min-width: 20px` and `min-height: 0.8em` are applied (an 8px spacer grew to 13px).
- **Where:** [src/Skeleton.css:45-51](src/Skeleton.css#L45-L51), [src/Skeleton.css:73-77](src/Skeleton.css#L73-L77)

### SKX-17: Empty spacer divs become grey blocks ✅
`div:empty` is painted, so dividers, spacers and decorative divs all show up as skeleton blocks.

### SKX-18: Generic and app-specific class names in the global CSS ✅
`.icon` and `.avatar` are forced to `border-radius: 50%` (verified on `.icon`). `.line`, `.thumbnail`, `.movie-title`, `.movie-rating` and `.poster-placeholder` are demo-app classes that ended up in the library, so user classes with these names get restyled.

### SKX-19: `.not-skeleton` does not protect its children ✅
Children of `.not-skeleton` are still made transparent (`color: rgba(0,0,0,0)`).
- **Where:** [src/Skeleton.css:35](src/Skeleton.css#L35), [src/Skeleton.css:194-197](src/Skeleton.css#L194-L197)

### SKX-20: Control components do nothing in default (CSS) mode ✅
`SkeletonKeep`, `SkeletonIgnore` and `SkeletonUnite` (and `exceptTags` / `exceptTagGroups`) only work with `useAST`. In default mode, `<SkeletonKeep>` content is still masked. This is not documented.

### SKX-21: `useAST` puts `div`s inside inline and interactive elements ✅
`<button>Hi {name}</button>` becomes `<button><div>Hi </div><div>Amit</div></button>`. That is invalid HTML and changes the layout. The same happens inside `a`, `option` and similar.
- **Where:** [src/hooks/useAddSkeleton.tsx:24-27](src/hooks/useAddSkeleton.tsx#L24-L27)

### SKX-22: `excludeSelector` style is global ✅
The injected `<style>` rule `.skeletonify-loading <selector>` affects every skeleton on the page, not only this one. It also doesn't match leaf elements in AST mode.
- **Where:** [src/Skeleton.tsx:112-120](src/Skeleton.tsx#L112-L120)

### SKX-23: `restProps` duplicated on every `count` copy ✅
`count={2} id="x"` renders two elements with the same `id`. Handlers like `onClick` are attached to every copy too.

### SKX-24: Loaded state drops `className`, `style` and props ✅
With plain children and `loading={false}`, the component returns `<>{children}</>`. `className`, `style`, `id` and other props are silently ignored, which is inconsistent with the loading state.
- **Where:** [src/Skeleton.tsx:177](src/Skeleton.tsx#L177)

### SKX-25: Not usable in Next.js App Router 🔍
There is no `'use client'` directive, but the package uses `createContext` and hooks, so importing it from a Server Component fails.

---

## 🟡 Minor / code quality

### SKX-26: Hook called after an early return 🔍
`useAddSkeleton` is called after `if (!loading && !children) return null`, which breaks the Rules of Hooks. It only works because the "hook" contains no real hooks. [src/Skeleton.tsx:110-127](src/Skeleton.tsx#L110-L127)

### SKX-27: Forwarded ref isn't merged 🔍
`ref || internalRef` has two problems: a callback ref breaks `lazy` (`ref.current` is undefined), and `cloneElement` overwrites the child's own ref. [src/Skeleton.tsx:61](src/Skeleton.tsx#L61)

### SKX-28: User keys are overwritten with index keys 🔍
`key: i` replaces the keys the user set inside the render function, which hurts reordering.

### SKX-29: AST traversal isn't memoized 🔍
The tree is re-walked for every `count` copy and on every render, re-running component render functions each time.

### SKX-30: `SkeletonTheme` covers only some props 🔍
The theme has no `count`, `circle`, `stagger`, `lazy`, `randomWidth` or `showWrapper`.

### SKX-31: Control components identified by identity 🔍
`element === SkeletonKeep` fails if the app ends up with two copies of the library.

### SKX-32: Dead code 🔍
- Unused `React` import in `checkTagInGroup.ts`.
- Unused `--skeletonify-card-bg` variable.
- `skeletonify-shimmer` and `skeletonify-wave` keyframes are identical.
- Empty `''` class parts leave extra spaces in `className`.

---

## ♿ Accessibility

### SKX-33: No `prefers-reduced-motion` support 🔍

### SKX-34: Hidden placeholder text is still read and focusable 🔍
Transparent placeholder text (for example "Loading Name...") is still read by screen readers. Inputs and buttons can still be reached with Tab; only `pointer-events` is disabled.

### SKX-35: `aria-live` is set on every item, even after loading ✅
Every item gets `aria-live="polite"`, even after loading (`aria-busy="false"`). That produces noisy announcements.

### SKX-36: No dark-mode default colours 🔍

---

## 📦 Packaging and docs

### SKX-37: Types not exported 🔍
`SkeletonProps`, `SkeletonThemeProps` and `HtmlTagGroup` aren't exported from `index.tsx`.

### SKX-38: Peer dependency is wrong 🔍
It says `react >=16.8`, but the build uses `react/jsx-runtime`, which needs React 16.14 or newer.

### SKX-39: `package.json` gaps 🔍
It is missing `"sideEffects": ["*.css"]` and a `"./package.json"` entry in `exports`.

### SKX-40: Naming mismatch 🔍
The package is `react-skeletonix`, but the CSS classes and variables use `skeletonify-*`.

### SKX-41: README is wrong or incomplete 🔍
- The `data` example crashes (SKX-06).
- The highlight colour is `#f8f8f8` in the README but `#fcfcfc` in the CSS.
- The README says `data` is `T` when it is `T[]`.
- Undocumented: `useAST`, `SkeletonTheme`, the control components, `lazy`, `stagger`, `randomWidth`, `container`, `borderRadius`, `exceptTags`, `exceptTagGroups`, `animate`.

### SKX-42: No tests, lint config or CI 🔍

---

## Suggested fix order
1. **SKX-01, 02, 07, 08**: the core CSS strategy. Style the element that carries the class *and* its descendants, and draw text and images as real blocks.
2. **SKX-03, 04, 05**: AST mode. Stop calling components directly, or clearly mark AST mode as HTML-only.
3. **SKX-06, 11, 13, 24**: make the loaded state clean, and decide what `data` means.
4. **SKX-09, 10**: finish `lazy`, then rebuild and publish.
5. Everything else.
