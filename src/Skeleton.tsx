import * as React from 'react';
import { HtmlTagGroup } from './constants/tags';
import { ANCHOR_ATTR, decorateAnchored } from './utils/anchors';
import { SkeletonStateContext } from './context';
import { decorateSubtrees, tagsSelector, validSelector } from './utils/marks';
import {
    INERT_PROP,
    assignRef,
    cx,
    getElementRef,
    isHostElement,
    mergeRefs,
    toArray,
    useIsoLayoutEffect,
    withKey,
} from './utils/react';
import './Skeleton.css';

export type SkeletonVariant = 'shimmer' | 'pulse' | 'wave' | 'blink' | 'none';
export type SkeletonColorScheme = 'light' | 'dark' | 'auto';
export type SkeletonSurfaces = 'hidden' | 'outlined' | 'visible';

/** Options shared by <Skeleton> and <SkeletonTheme>. */
export interface SkeletonOptions {
    /** Number of skeleton copies to render while loading. Default `1`. */
    count?: number;
    /** Animation length in seconds. Default `1.5`. */
    duration?: number;
    /** Set `false` for static blocks. Default `true`. */
    animate?: boolean;
    /** Animation style. Default `'shimmer'`. */
    variant?: SkeletonVariant;
    /** Colour of the skeleton blocks. */
    baseColor?: string;
    /** Colour of the moving highlight (shimmer / wave). */
    highlightColor?: string;
    /** Corner radius of text blocks, e.g. `8` or `'0.5rem'`. Default `4px`. */
    borderRadius?: string | number;
    /** Default colours for light or dark UIs; `'auto'` follows the OS. Default `'light'`. */
    colorScheme?: SkeletonColorScheme;
    /**
     * Cards, panels and other containers while loading: `'hidden'` (default)
     * shows only the content blocks, `'outlined'` keeps their borders,
     * `'visible'` keeps their background, border and shadow.
     */
    surfaces?: SkeletonSurfaces;
    /** Render every block as a circle. */
    circle?: boolean;
    /** Render each wrapped element as one solid block. */
    container?: boolean;
    /** Vary the width of text lines, optionally within `[min, max]` percent. */
    randomWidth?: boolean | [number, number];
    /** Show a line for empty text elements (e.g. `<h3>{user?.name}</h3>` before data arrives). Default `true`. */
    fillEmpty?: boolean;
    /** Wrap non-element children in a `display: contents` div. Default `true`. */
    showWrapper?: boolean;
    /** Delay between copies in seconds (`true` = 0.1s). Default `true`. */
    stagger?: boolean | number;
    /** Only animate while the skeleton is in the viewport. */
    lazy?: boolean;
    /** Elements matching this selector are hidden (space is kept) while loading. */
    excludeSelector?: string;
    /** Tags shown as-is (not masked) while loading, e.g. `['button']`. */
    exceptTags?: string[];
    /** Tag groups shown as-is while loading, e.g. `['MEDIA_TAGS']`. */
    exceptTagGroups?: HtmlTagGroup[];
    /** @deprecated No longer needed: every mode now handles nested components. */
    useAST?: boolean;
}

export type SkeletonThemeProps = SkeletonOptions;

const SkeletonThemeContext = React.createContext<SkeletonThemeProps | undefined>(undefined);

/** Sets default options for every <Skeleton> below it. Themes can be nested. */
export const SkeletonTheme: React.FC<SkeletonThemeProps & { children?: React.ReactNode }> = ({ children, ...themeProps }) => {
    const parent = React.useContext(SkeletonThemeContext);
    const merged = { ...parent, ...definedOnly(themeProps) };
    const key = JSON.stringify(merged);
    // Stable context value while the options are unchanged.
    const value = React.useMemo(() => merged, [key]); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <SkeletonThemeContext.Provider value={value}>
            {children}
        </SkeletonThemeContext.Provider>
    );
};

export interface SkeletonProps<T = any> extends SkeletonOptions, Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
    /** Shows the skeleton while `true`; renders the real children when `false`. */
    loading: boolean;
    /** Content to mask, or a render function `(item, index) => node`. */
    children?: React.ReactNode | ((item: T | null, index: number) => React.ReactNode);
    /** Items passed to a render function once loading is done. A single item is also accepted. */
    data?: T[] | T | null;
    /** Item passed to a render function while loading (defaults to `null`). */
    placeholderData?: T;
}

function definedOnly<O extends object>(obj: O): Partial<O> {
    const out: Partial<O> = {};
    (Object.keys(obj) as Array<keyof O>).forEach((k) => {
        if (obj[k] !== undefined) out[k] = obj[k];
    });
    return out;
}

const DEFAULTS = {
    count: 1,
    animate: true,
    variant: 'shimmer' as SkeletonVariant,
    colorScheme: 'light' as SkeletonColorScheme,
    surfaces: 'hidden' as SkeletonSurfaces,
    showWrapper: true,
    fillEmpty: true,
    stagger: true as boolean | number,
    lazy: false,
};

// Deterministic "random" widths: stable across re-renders and SSR/CSR.
function widthVars(randomWidth: SkeletonOptions['randomWidth'], index: number): Record<string, string> {
    if (!randomWidth) return {};
    const [min, max] = Array.isArray(randomWidth) ? randomWidth : [60, 100];
    const pick = (n: number) => {
        const x = Math.sin((index + 1) * 9301 + n * 49297) * 233280;
        return `${Math.round(min + (x - Math.floor(x)) * (max - min))}%`;
    };
    return { '--skx-w1': pick(1), '--skx-w2': pick(2), '--skx-w3': pick(3) };
}

/**
 * Internal implementation of the Skeleton component
 */
const SkeletonInternal = <T,>(
    props: SkeletonProps<T>,
    ref: React.ForwardedRef<HTMLElement>
) => {
    const theme = React.useContext(SkeletonThemeContext);

    const {
        loading,
        children,
        data,
        placeholderData,
        count,
        duration,
        animate,
        variant,
        baseColor,
        highlightColor,
        borderRadius,
        colorScheme,
        surfaces,
        circle,
        container,
        randomWidth,
        showWrapper,
        fillEmpty,
        stagger,
        lazy,
        excludeSelector,
        exceptTags,
        exceptTagGroups,
        useAST,
        className,
        style,
        ...restProps
    } = { ...DEFAULTS, ...theme, ...definedOnly(props) } as SkeletonProps<T> & typeof DEFAULTS;

    const copies = loading ? Math.max(0, Math.floor(count)) : 0;

    // Root elements of every skeleton copy, by index.
    const roots = React.useRef(new Map<number, Element>());
    const anchors = React.useRef(new Map<number, Element>());
    const anchorRoots = React.useRef(new Map<number, Element[]>());

    // lazy: indexes of the copies currently in the viewport. Copies outside it
    // are static, so long lists only pay for the animations on screen.
    const [inView, setInView] = React.useState<ReadonlySet<number>>(NO_COPIES);
    const [noObserver, setNoObserver] = React.useState(false);
    const animates = (i: number) => animate && (!lazy || noObserver || inView.has(i));

    const baseClass = cx(
        'skx-loading',
        `skx-v-${variant}`,
        circle && 'skx-circle',
        container && 'skx-container',
        randomWidth && 'skx-random',
        colorScheme !== 'light' && `skx-scheme-${colorScheme}`,
        surfaces !== 'hidden' && `skx-surfaces-${surfaces}`,
        !fillEmpty && 'skx-no-fill'
    );
    const classFor = (i: number) => cx(baseClass, animates(i) && 'skx-animate');

    const baseVars = React.useMemo(() => {
        const vars: Record<string, string> = {};
        if (duration !== undefined) vars['--skx-duration'] = `${duration}s`;
        if (baseColor) vars['--skx-base-color'] = baseColor;
        if (highlightColor) vars['--skx-highlight-color'] = highlightColor;
        if (borderRadius !== undefined) vars['--skx-border-radius'] = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
        return vars;
    }, [duration, baseColor, highlightColor, borderRadius]);

    const varsFor = (i: number): Record<string, string> => {
        const step = stagger === false ? 0 : typeof stagger === 'number' ? stagger : 0.1;
        return { ...baseVars, ...widthVars(randomWidth, i), '--skx-delay': `${+(step * i).toFixed(3)}s` };
    };

    if (useAST !== undefined) warnUseAST();

    // Exposed to useSkeleton() / <SkeletonScope>. A loaded skeleton inside a
    // loading one passes the outer state through.
    const parentState = React.useContext(SkeletonStateContext);
    const state = React.useMemo(
        () => (loading ? { loading: true, className: classFor(0), vars: baseVars } : parentState),
        [loading, classFor(0), baseVars, parentState] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const keepSelector = tagsSelector(exceptTags, exceptTagGroups);

    // Latest decoration for anchor mode (read inside the layout effect).
    const decorations = React.useRef<Record<number, { classes: string[]; vars: Record<string, string> }>>({});

    // Stable per-index ref callbacks that register skeleton roots.
    const refCache = React.useRef<Record<number, React.RefCallback<Element>>>({});
    const rootRef = (i: number): React.RefCallback<Element> =>
        (refCache.current[i] ??= (el: Element | null) => {
            if (el) roots.current.set(i, el);
            else roots.current.delete(i);
        });
    const anchorCache = React.useRef<Record<number, React.RefCallback<Element>>>({});
    const anchorRef = (i: number): React.RefCallback<Element> =>
        (anchorCache.current[i] ??= (el: Element | null) => {
            if (el) anchors.current.set(i, el);
            else anchors.current.delete(i);
        });

    // Runs after every commit: decorate anchor-mode roots and expose the first
    // root through the forwarded ref.
    useIsoLayoutEffect(() => {
        const cleanups: Array<() => void> = [];
        anchorRoots.current = new Map();

        anchors.current.forEach((start, i) => {
            const deco = decorations.current[i];
            if (!deco) return;
            cleanups.push(decorateAnchored(
                start,
                { classes: deco.classes, vars: deco.vars, attrs: { 'aria-busy': 'true', inert: '' } },
                (els) => anchorRoots.current.set(i, els)
            ));
        });

        const allRoots = [...roots.current.values(), ...Array.from(anchorRoots.current.values()).flat()];
        cleanups.push(decorateSubtrees(allRoots, [
            [validSelector(excludeSelector), 'ignore'],
            [validSelector(keepSelector), 'keep'],
        ], { fill: fillEmpty }));

        const first = (roots.current.get(0) ?? anchorRoots.current.get(0)?.[0] ?? null) as HTMLElement | null;
        assignRef(ref, first);

        return () => {
            cleanups.forEach((fn) => fn());
            assignRef(ref, null);
        };
    });

    // lazy: track which copies are in the viewport. Wrapper roots are
    // display:contents (no box), so their children are observed.
    React.useEffect(() => {
        if (!lazy || !loading) return;
        if (typeof IntersectionObserver === 'undefined') {
            setNoObserver(true);
            return;
        }
        const copyOf = new Map<Element, number>();
        const add = (el: Element, i: number) => {
            if (el.classList.contains('skx-wrapper') && el.children.length) Array.from(el.children).forEach((c) => copyOf.set(c, i));
            else copyOf.set(el, i);
        };
        roots.current.forEach(add);
        anchorRoots.current.forEach((els, i) => els.forEach((el) => add(el, i)));
        if (!copyOf.size) return;

        const visible = new Set<Element>();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
            const next = new Set<number>();
            visible.forEach((el) => next.add(copyOf.get(el)!));
            setInView((prev) => (prev.size === next.size && Array.from(next).every((i) => prev.has(i)) ? prev : next));
        }, { threshold: 0.01 });
        copyOf.forEach((_, el) => observer.observe(el));
        return () => observer.disconnect();
    }, [lazy, loading, copies, showWrapper]);

    const provide = (content: React.ReactNode) => (
        <SkeletonStateContext.Provider value={state}>{content}</SkeletonStateContext.Provider>
    );

    // ---- Loaded: render the real content, untouched ----
    if (!loading) {
        if (typeof children === 'function') {
            return provide(toArray(data).map((item, i) => withKey(children(item, i), i)));
        }
        // Same key as the first loading copy, so a single element child is
        // updated in place (not remounted) when loading ends.
        if (isHostElement(children)) return provide([React.cloneElement(children, { key: 'skx-0' })]);
        return provide(children);
    }

    // ---- Loading ----
    const items: React.ReactNode[] = [];
    decorations.current = {};

    for (let i = 0; i < copies; i++) {
        const content: React.ReactNode = typeof children === 'function'
            ? children(placeholderData ?? null, i)
            : children;

        const vars = varsFor(i);
        const rootClass = classFor(i);
        const rootStyle = { ...vars, ...style } as React.CSSProperties;
        // Extra HTML props (id, handlers, data-*) go on the first copy only.
        const extra = i === 0 ? restProps : {};
        const a11y = { 'aria-busy': true as const, ...INERT_PROP };

        if (isHostElement(content)) {
            const childRef = getElementRef(content);
            items.push(React.cloneElement(content, {
                ...extra,
                ...a11y,
                key: `skx-${i}`,
                ref: childRef ? mergeRefs(childRef, rootRef(i)) : rootRef(i),
                className: cx(content.props.className, rootClass, className),
                style: { ...content.props.style, ...rootStyle },
            } as Record<string, unknown>));
        } else if (typeof content === 'string' || typeof content === 'number') {
            // Bare text: an inline root that is itself drawn as a text line.
            items.push(
                <span
                    {...extra}
                    {...a11y}
                    key={`skx-${i}`}
                    ref={rootRef(i) as React.Ref<HTMLSpanElement>}
                    className={cx(rootClass, className)}
                    style={rootStyle}
                >
                    {content}
                </span>
            );
        } else if (showWrapper || !React.isValidElement(content)) {
            items.push(
                <div
                    {...extra}
                    {...a11y}
                    key={`skx-${i}`}
                    ref={rootRef(i) as React.Ref<HTMLDivElement>}
                    className={cx('skx-wrapper', rootClass, className)}
                    style={rootStyle}
                >
                    {content}
                </div>
            );
        } else {
            decorations.current[i] = { classes: cx(rootClass, className).split(' '), vars };
            items.push(
                <React.Fragment key={`skx-${i}`}>
                    <template {...{ [ANCHOR_ATTR]: 'start' }} ref={anchorRef(i) as React.Ref<HTMLTemplateElement>} />
                    {content}
                    <template {...{ [ANCHOR_ATTR]: 'end' }} />
                </React.Fragment>
            );
        }
    }

    return provide(items);
};

const NO_COPIES: ReadonlySet<number> = new Set();

let warnedUseAST = false;
function warnUseAST() {
    if (warnedUseAST) return;
    warnedUseAST = true;
    console.warn('[react-skeletonix] `useAST` is deprecated and has no effect: nested components are skeletonized automatically.');
}

/**
 * The Skeleton component with full generic type support.
 */
export const Skeleton = React.forwardRef(SkeletonInternal) as <T = any>(
    // HTMLDivElement refs from 1.0.x keep type-checking.
    props: SkeletonProps<T> & { ref?: React.Ref<HTMLElement> | React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

(Skeleton as any).displayName = 'Skeleton';

export default Skeleton;
