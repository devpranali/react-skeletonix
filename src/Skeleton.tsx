import React, { forwardRef, useMemo, createContext, useContext, useRef } from 'react';
import useAddSkeleton from './hooks/useAddSkeleton';
import useIntersection from './hooks/useIntersection';
import { HtmlTagGroup } from './constants/tags';
import './Skeleton.css';

/**
 * Global Theme Configuration for all Skeletons
 */
export interface SkeletonThemeProps {
    baseColor?: string;
    highlightColor?: string;
    duration?: number;
    borderRadius?: string | number;
    animate?: boolean;
    variant?: 'shimmer' | 'pulse' | 'wave' | 'blink' | 'none';
    useAST?: boolean;
}

const SkeletonThemeContext = createContext<SkeletonThemeProps | undefined>(undefined);

export const SkeletonTheme: React.FC<SkeletonThemeProps & { children: React.ReactNode }> = ({ children, ...themeProps }) => {
    return (
        <SkeletonThemeContext.Provider value={themeProps}>
            {children}
        </SkeletonThemeContext.Provider>
    );
};

export interface SkeletonProps<T = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    loading: boolean;
    children?: React.ReactNode | ((item: T | null, index: number) => React.ReactNode);
    data?: T[];
    count?: number;
    duration?: number;
    animate?: boolean;
    variant?: 'shimmer' | 'pulse' | 'wave' | 'blink' | 'none';
    baseColor?: string;
    highlightColor?: string;
    borderRadius?: string | number;
    circle?: boolean;
    excludeSelector?: string;
    showWrapper?: boolean;
    randomWidth?: boolean | [number, number];
    container?: boolean;
    useAST?: boolean;
    exceptTags?: string[];
    exceptTagGroups?: HtmlTagGroup[];
    lazy?: boolean;
    stagger?: boolean | number;
}

/**
 * Internal implementation of the Skeleton component
 */
const SkeletonInternal = <T,>(
    props: SkeletonProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as any) || internalRef;
    const theme = useContext(SkeletonThemeContext);

    const {
        loading,
        children,
        data,
        count = 1,
        duration = props.duration ?? theme?.duration,
        animate = props.animate ?? theme?.animate ?? true,
        variant = props.variant ?? theme?.variant ?? 'shimmer',
        baseColor = props.baseColor ?? theme?.baseColor,
        highlightColor = props.highlightColor ?? theme?.highlightColor,
        borderRadius = props.borderRadius ?? theme?.borderRadius,
        circle,
        excludeSelector,
        showWrapper = true,
        randomWidth,
        container,
        useAST = props.useAST ?? theme?.useAST ?? false,
        exceptTags = [],
        exceptTagGroups = [],
        lazy = false,
        stagger = true,
        className = '',
        style,
        ...restProps
    } = props;

    const isVisible = useIntersection(combinedRef, { enabled: lazy, threshold: 0.1 });
    const shouldAnimate = animate && (!lazy || isVisible);

    const customStyles = useMemo(() => {
        const s: any = { ...style };
        if (duration !== undefined) s['--skx-duration'] = `${duration}s`;
        if (baseColor) s['--skx-base-color'] = baseColor;
        if (highlightColor) s['--skx-highlight-color'] = highlightColor;
        if (borderRadius !== undefined) s['--skx-border-radius'] = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
        return s as React.CSSProperties;
    }, [duration, baseColor, highlightColor, borderRadius, style]);

    // Deterministic "random" widths: stable across re-renders and SSR/CSR.
    const getWidthStyle = (index = 0) => {
        if (!randomWidth) return {};
        const [min, max] = Array.isArray(randomWidth) ? randomWidth : [60, 100];
        const pick = (n: number) => {
            const x = Math.sin((index + 1) * 9301 + n * 49297) * 233280;
            return Math.round(min + (x - Math.floor(x)) * (max - min));
        };
        return { '--skx-w1': `${pick(1)}%`, '--skx-w2': `${pick(2)}%`, '--skx-w3': `${pick(3)}%` } as React.CSSProperties;
    };

    if (!loading && !children) return null;

    const excludeStyles = (loading && excludeSelector) ? (
        <style>
            {`.skx-loading ${excludeSelector} { visibility: hidden !important; }`}
        </style>
    ) : null;

    const addSkeleton = useAddSkeleton({
        className: `skx-loading ${shouldAnimate ? 'skx-animate' : ''} skx-v-${variant} ${circle ? 'skx-circle' : ''} ${container ? 'skx-container' : ''} ${randomWidth ? 'skx-random' : ''}`,
        style: { ...customStyles, ...getWidthStyle() },
        exceptTags,
        exceptTagGroups
    });

    if (typeof children === 'function') {
        const itemsToRender = loading
            ? Array.from({ length: count }, (_, i) => children(null, i))
            : (data || []).map((item, i) => children(item, i));

        return (
            <>
                {loading && excludeStyles}
                {itemsToRender.map((content, i) => {
                    const finalContent = (loading && useAST && React.isValidElement(content))
                        ? addSkeleton(content)
                        : content;

                    const staggeredDelay = (stagger && loading) ? (typeof stagger === 'number' ? stagger : 0.1) * i : 0;
                    const skeletonClassName = `${className} ${!useAST && loading ? 'skx-loading' : ''} ${!useAST && loading && shouldAnimate ? 'skx-animate' : ''} ${!useAST && loading ? `skx-v-${variant}` : ''} ${!useAST && loading && circle ? 'skx-circle' : ''} ${!useAST && loading && container ? 'skx-container' : ''} ${!useAST && randomWidth ? 'skx-random' : ''}`.trim();
                    const skeletonStyle = loading && !useAST
                        ? { ...customStyles, ...getWidthStyle(i), '--skx-delay': `${staggeredDelay}s` } as React.CSSProperties
                        : style;

                    if (React.isValidElement(finalContent) && typeof finalContent.type === 'string') {
                        const element = finalContent as React.ReactElement<any>;
                        return React.cloneElement(element, {
                            key: i,
                            className: `${element.props.className || ''} ${skeletonClassName}`.trim(),
                            style: { ...(element.props.style || {}), ...skeletonStyle },
                            "aria-busy": loading ? "true" : "false",
                            "aria-live": "polite",
                            ...restProps
                        } as any);
                    }

                    return (
                        <div
                            key={i}
                            className={`${showWrapper ? 'skx-wrapper' : ''} ${skeletonClassName}`.trim()}
                            style={skeletonStyle}
                            aria-busy={loading ? "true" : "false"}
                            aria-live="polite"
                            {...restProps}
                        >
                            {finalContent}
                        </div>
                    );
                })}
            </>
        );
    }

    if (!loading) return <>{children}</>;

    const skeletonClassName = `${className} ${!useAST ? 'skx-loading' : ''} ${!useAST && shouldAnimate ? 'skx-animate' : ''} ${!useAST ? `skx-v-${variant}` : ''} ${!useAST && circle ? 'skx-circle' : ''} ${!useAST && container ? 'skx-container' : ''} ${!useAST && randomWidth ? 'skx-random' : ''}`.trim();
    const skeletonStyle = !useAST ? customStyles : style;

    const skeletonItems = Array.from({ length: count }, (_, i) => {
        const staggeredDelay = (stagger && loading) ? (typeof stagger === 'number' ? stagger : 0.1) * i : 0;
        const currentStyle = { ...skeletonStyle, ...(!useAST ? getWidthStyle(i) : {}), '--skx-delay': `${staggeredDelay}s` } as React.CSSProperties;
        const finalChildren = (loading && useAST)
            ? React.Children.map(children, (child) => addSkeleton(child))
            : children;

        if (React.isValidElement(finalChildren) && typeof finalChildren.type === 'string') {
            const element = finalChildren as React.ReactElement<any>;
            return React.cloneElement(element, {
                key: i,
                ref: i === 0 ? combinedRef : undefined,
                className: `${element.props.className || ''} ${skeletonClassName}`.trim(),
                style: { ...(element.props.style || {}), ...currentStyle },
                "aria-busy": "true",
                "aria-live": "polite",
                ...restProps
            } as any);
        }

        return (
            <div
                key={i}
                ref={i === 0 ? combinedRef : undefined}
                className={`${showWrapper ? 'skx-wrapper' : ''} ${skeletonClassName}`.trim()}
                style={currentStyle}
                aria-busy="true"
                aria-live="polite"
                {...restProps}
            >
                {finalChildren}
            </div>
        );
    });

    return (
        <>
            {excludeStyles}
            {skeletonItems}
        </>
    );
};

/**
 * The Skeleton component with full generic type support.
 */
export const Skeleton = forwardRef(SkeletonInternal) as <T = any>(
    props: SkeletonProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null;

(Skeleton as any).displayName = 'Skeleton';

export default Skeleton;
