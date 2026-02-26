import React, { forwardRef, useMemo, createContext, useContext } from 'react';
import useAddSkeleton from './hooks/useAddSkeleton';
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
    useAST?: boolean; // Opt-in to the advanced AST recursive parsing
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
    duration?: number; // Animation duration in seconds
    animate?: boolean; // Toggle animation
    variant?: 'shimmer' | 'pulse' | 'wave' | 'blink' | 'none'; // Animation type
    baseColor?: string;
    highlightColor?: string;
    borderRadius?: string | number;
    circle?: boolean; // Force all direct children masks to be circles
    excludeSelector?: string; // CSS selector of elements to hide during loading
    showWrapper?: boolean; // Whether to show the static card-style background
    randomWidth?: boolean | [number, number]; // Whether to apply random widths to text lines, or a range [min, max]
    container?: boolean; // If true, masks the entire wrapper as a single block, ignoring children
    useAST?: boolean; // Use React.Children recursive traversal instead of pure CSS
    exceptTags?: string[]; // Array of HTML tags to ignore (AST mode only)
    exceptTagGroups?: HtmlTagGroup[]; // Semantic groups to ignore (AST mode only)
}

export const Skeleton = forwardRef(<T,>(props: SkeletonProps<T>, ref: React.ForwardedRef<HTMLDivElement>) => {
    const theme = useContext(SkeletonThemeContext);

    // Destructure props, using theme defaults if not provided
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
        className = '',
        style,
        ...restProps
    } = props;

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

    // --- AST Mode Orchestration ---
    const addSkeleton = useAddSkeleton({
        className: `skeletonify-loading ${animate ? 'skeletonify-animate' : ''} skeletonify-variant-${variant} ${circle ? 'skeletonify-circle' : ''} ${container ? 'skeletonify-container-mode' : ''} ${randomWidth ? 'skeletonify-random-widths' : ''}`,
        style: { ...customStyles, ...getWidthStyle() },
        exceptTags,
        exceptTagGroups
    });

    // Handle Function-as-Child pattern
    if (typeof children === 'function') {
        const itemsToRender = loading
            ? Array.from({ length: count }, (_, i) => children(null, i))
            : (data || []).map((item, i) => children(item, i));

        return (
            <>
                {loading && excludeStyles}
                {itemsToRender.map((content, i) => {
                    // If AST mode, transform the generated content
                    const finalContent = (loading && useAST && React.isValidElement(content))
                        ? addSkeleton(content)
                        : content;

                    const skeletonClassName = `${className} ${!useAST && loading ? 'skeletonify-loading' : ''} ${!useAST && loading && animate ? 'skeletonify-animate' : ''} ${!useAST && loading ? `skeletonify-variant-${variant}` : ''} ${!useAST && loading && circle ? 'skeletonify-circle' : ''} ${!useAST && loading && container ? 'skeletonify-container-mode' : ''} ${!useAST && randomWidth ? 'skeletonify-random-widths' : ''}`.trim();
                    const skeletonStyle = loading && !useAST ? { ...customStyles, ...getWidthStyle() } : style;

                    // Avoid destructive <div> wrappers by cloning native elements
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

                    // Fallback wrapper for text nodes or custom components
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

    // Default behavior for static children
    if (!loading) {
        return <>{children}</>;
    }

    // --- Static Children ---
    const skeletonClassName = `${className} ${!useAST ? 'skeletonify-loading' : ''} ${!useAST && animate ? 'skeletonify-animate' : ''} ${!useAST ? `skeletonify-variant-${variant}` : ''} ${!useAST && circle ? 'skeletonify-circle' : ''} ${!useAST && container ? 'skeletonify-container-mode' : ''} ${!useAST && randomWidth ? 'skeletonify-random-widths' : ''}`.trim();
    const skeletonStyle = !useAST ? { ...customStyles, ...getWidthStyle() } : style;

    const skeletonItems = Array.from({ length: count }, (_, i) => {
        // If AST mode, we recursively map the children, putting them in an invisible state
        // and appending skeletonized versions. If not, we just rely on CSS inheritance.
        const finalChildren = (loading && useAST)
            ? React.Children.map(children, (child) => addSkeleton(child))
            : children;

        // Avoid destructive <div> wrappers by cloning native elements
        if (React.isValidElement(finalChildren) && typeof finalChildren.type === 'string') {
            const element = finalChildren as React.ReactElement<any>;
            return React.cloneElement(element, {
                key: i,
                ref: i === 0 ? ref : undefined,
                className: `${element.props.className || ''} ${skeletonClassName}`.trim(),
                style: { ...(element.props.style || {}), ...skeletonStyle },
                "aria-busy": "true",
                "aria-live": "polite",
                ...restProps
            } as any);
        }

        // Fallback
        return (
            <div
                key={i}
                ref={i === 0 ? ref : undefined}
                className={`${showWrapper ? 'skeletonify-wrapper' : ''} ${skeletonClassName}`.trim()}
                style={skeletonStyle}
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
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
