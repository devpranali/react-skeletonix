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
        if (duration !== undefined) s['--skeletonify-duration'] = `${duration}s`;
        if (baseColor) s['--skeletonify-base-color'] = baseColor;
        if (highlightColor) s['--skeletonify-highlight-color'] = highlightColor;
        if (borderRadius !== undefined) s['--skeletonify-border-radius'] = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
        return s as React.CSSProperties;
    }, [duration, baseColor, highlightColor, borderRadius, style]);

    const getWidthStyle = () => {
        if (!randomWidth) return {};
        const min = Array.isArray(randomWidth) ? randomWidth[0] : 60;
        const max = Array.isArray(randomWidth) ? randomWidth[1] : 100;
        const randomPercent = Math.floor(Math.random() * (max - min + 1) + min);
        return { '--skeletonify-random-width': `${randomPercent}%` } as React.CSSProperties;
    };

    if (!loading && !children) return null;

    const excludeStyles = (loading && excludeSelector) ? (
        <style>
            {`.skeletonify-loading ${excludeSelector} { 
        opacity: 0 !important; 
        pointer-events: none !important; 
        visibility: hidden !important; 
      }`}
        </style>
    ) : null;

    const addSkeleton = useAddSkeleton({
        className: `skeletonify-loading ${shouldAnimate ? 'skeletonify-animate' : ''} skeletonify-variant-${variant} ${circle ? 'skeletonify-circle' : ''} ${container ? 'skeletonify-container-mode' : ''} ${randomWidth ? 'skeletonify-random-widths' : ''}`,
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
                    const skeletonClassName = `${className} ${!useAST && loading ? 'skeletonify-loading' : ''} ${!useAST && loading && shouldAnimate ? 'skeletonify-animate' : ''} ${!useAST && loading ? `skeletonify-variant-${variant}` : ''} ${!useAST && loading && circle ? 'skeletonify-circle' : ''} ${!useAST && loading && container ? 'skeletonify-container-mode' : ''} ${!useAST && randomWidth ? 'skeletonify-random-widths' : ''}`.trim();
                    const skeletonStyle = loading && !useAST
                        ? { ...customStyles, ...getWidthStyle(), '--skeletonify-delay': `${staggeredDelay}s` } as React.CSSProperties
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
                            className={`${showWrapper ? 'skeletonify-wrapper' : ''} ${skeletonClassName}`.trim()}
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

    const skeletonClassName = `${className} ${!useAST ? 'skeletonify-loading' : ''} ${!useAST && shouldAnimate ? 'skeletonify-animate' : ''} ${!useAST ? `skeletonify-variant-${variant}` : ''} ${!useAST && circle ? 'skeletonify-circle' : ''} ${!useAST && container ? 'skeletonify-container-mode' : ''} ${!useAST && randomWidth ? 'skeletonify-random-widths' : ''}`.trim();
    const skeletonStyle = !useAST ? { ...customStyles, ...getWidthStyle() } : style;

    const skeletonItems = Array.from({ length: count }, (_, i) => {
        const staggeredDelay = (stagger && loading) ? (typeof stagger === 'number' ? stagger : 0.1) * i : 0;
        const currentStyle = { ...skeletonStyle, '--skeletonify-delay': `${staggeredDelay}s` } as React.CSSProperties;
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
                className={`${showWrapper ? 'skeletonify-wrapper' : ''} ${skeletonClassName}`.trim()}
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
