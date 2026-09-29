import * as React from 'react';
import useIntersection from './hooks/useIntersection';
import { HtmlTagGroup } from './constants/tags';
import { ANCHOR_ATTR, decorateAnchored } from './utils/anchors';
import { markSubtrees, tagsSelector, validSelector } from './utils/marks';
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

/**
 * Global Theme Configuration for all Skeletons
 */
export interface SkeletonThemeProps {
    baseColor?: string;
    highlightColor?: string;
    duration?: number;
    borderRadius?: string | number;
    animate?: boolean;
    variant?: SkeletonVariant;
    /** @deprecated No longer needed: every mode now handles nested components. */
    useAST?: boolean;
}

const SkeletonThemeContext = React.createContext<SkeletonThemeProps | undefined>(undefined);

export const SkeletonTheme: React.FC<SkeletonThemeProps & { children: React.ReactNode }> = ({ children, ...themeProps }) => {
    return (
        <SkeletonThemeContext.Provider value={themeProps}>
            {children}
        </SkeletonThemeContext.Provider>
    );
};

export interface SkeletonProps<T = any> extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
    /** Shows the skeleton while `true`; renders the real children when `false`. */
    loading: boolean;
    /** Content to mask, or a render function `(item, index) => node`. */
    children?: React.ReactNode | ((item: T | null, index: number) => React.ReactNode);
    /** Items passed to a render function once loading is done. A single item is also accepted. */
    data?: T[] | T | null;
    /** Item passed to a render function while loading (defaults to `null`). */
    placeholderData?: T;
    /** Number of skeleton copies to render while loading. */
    count?: number;
    duration?: number;
    animate?: boolean;
    variant?: SkeletonVariant;
    baseColor?: string;
    highlightColor?: string;
    borderRadius?: string | number;
    circle?: boolean;
    /** Elements matching this selector are hidden (space is kept) while loading. */
    excludeSelector?: string;
    showWrapper?: boolean;
    randomWidth?: boolean | [number, number];
    container?: boolean;
    /** @deprecated No longer needed: every mode now handles nested components. */
    useAST?: boolean;
    /** Tags shown as-is (not masked) while loading, e.g. `['button']`. */
    exceptTags?: string[];
    /** Tag groups shown as-is while loading, e.g. `['MEDIA_TAGS']`. */
    exceptTagGroups?: HtmlTagGroup[];
    lazy?: boolean;
    stagger?: boolean | number;
}

// Deterministic "random" widths: stable across re-renders and SSR/CSR.
function widthVars(randomWidth: SkeletonProps['randomWidth'], index: number): Record<string, string> {
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
        count = 1,
        duration = theme?.duration,
        animate = theme?.animate ?? true,
        variant = theme?.variant ?? 'shimmer',
        baseColor = theme?.baseColor,
        highlightColor = theme?.highlightColor,
        borderRadius = theme?.borderRadius,
        circle,
        excludeSelector,
        showWrapper = true,
        randomWidth,
        container,
        useAST,
        exceptTags,
        exceptTagGroups,
        lazy = false,
        stagger = true,
        className,
        style,
        ...restProps
    } = props;

    const copies = loading ? Math.max(0, Math.floor(count)) : 0;

    // Root elements of every skeleton copy, by index.
    const roots = React.useRef(new Map<number, Element>());
    const anchors = React.useRef(new Map<number, Element>());
    const firstRoot = React.useRef<HTMLElement | null>(null);

    const isVisible = useIntersection(firstRoot, { enabled: lazy, threshold: 0.1 });
    const shouldAnimate = animate && (!lazy || isVisible);

    const rootClass = cx(
        'skx-loading',
        shouldAnimate && 'skx-animate',
        `skx-v-${variant}`,
        circle && 'skx-circle',
        container && 'skx-container',
        randomWidth && 'skx-random'
    );

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
        const anchorRoots = new Map<number, Element[]>();

        anchors.current.forEach((start, i) => {
            const deco = decorations.current[i];
            if (!deco) return;
            cleanups.push(decorateAnchored(
                start,
                { classes: deco.classes, vars: deco.vars, attrs: { 'aria-busy': 'true', inert: '' } },
                (els) => anchorRoots.set(i, els)
            ));
        });

        const allRoots = [...roots.current.values(), ...Array.from(anchorRoots.values()).flat()];
        cleanups.push(markSubtrees(allRoots, [
            [validSelector(excludeSelector), 'ignore'],
            [validSelector(keepSelector), 'keep'],
        ]));

        const first = (roots.current.get(0) ?? anchorRoots.get(0)?.[0] ?? null) as HTMLElement | null;
        firstRoot.current = first;
        assignRef(ref, first);

        return () => {
            cleanups.forEach((fn) => fn());
            assignRef(ref, null);
        };
    });

    // ---- Loaded: render the real content, untouched ----
    if (!loading) {
        if (typeof children === 'function') {
            return <>{toArray(data).map((item, i) => withKey(children(item, i), i))}</>;
        }
        return <>{children}</>;
    }

    // ---- Loading ----
    const classTokens = cx(rootClass, className).split(' ');
    const items: React.ReactNode[] = [];
    decorations.current = {};

    for (let i = 0; i < copies; i++) {
        const content: React.ReactNode = typeof children === 'function'
            ? children(placeholderData ?? null, i)
            : children;

        const vars = varsFor(i);
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
            decorations.current[i] = { classes: classTokens, vars };
            items.push(
                <React.Fragment key={`skx-${i}`}>
                    <template {...{ [ANCHOR_ATTR]: 'start' }} ref={anchorRef(i) as React.Ref<HTMLTemplateElement>} />
                    {content}
                    <template {...{ [ANCHOR_ATTR]: 'end' }} />
                </React.Fragment>
            );
        }
    }

    return <>{items}</>;
};

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
    props: SkeletonProps<T> & { ref?: React.ForwardedRef<HTMLElement> }
) => React.ReactElement | null;

(Skeleton as any).displayName = 'Skeleton';

export default Skeleton;
