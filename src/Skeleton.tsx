import React, { forwardRef, useMemo } from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    loading: boolean;
    children: React.ReactNode;
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
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({
    loading,
    children,
    count = 1,
    duration,
    animate = true,
    variant = 'shimmer',
    baseColor,
    highlightColor,
    borderRadius,
    circle,
    excludeSelector,
    showWrapper = true,
    className = '',
    style,
    ...props
}, ref) => {
    const customStyles = useMemo(() => {
        const s: any = { ...style };
        if (duration !== undefined) s['--skeletonify-duration'] = `${duration}s`;
        if (baseColor) s['--skeletonify-base-color'] = baseColor;
        if (highlightColor) s['--skeletonify-highlight-color'] = highlightColor;
        if (borderRadius !== undefined) s['--skeletonify-border-radius'] = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
        return s as React.CSSProperties;
    }, [duration, baseColor, highlightColor, borderRadius, style]);

    if (!loading) {
        return <>{children}</>;
    }

    const excludeStyles = excludeSelector ? (
        <style>
            {`.skeletonify-loading ${excludeSelector} { 
        opacity: 0 !important; 
        pointer-events: none !important; 
        visibility: hidden !important; 
      }`}
        </style>
    ) : null;

    const skeletonItems = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            ref={i === 0 ? ref : undefined}
            className={`${showWrapper ? 'skeletonify-wrapper' : ''} ${className} skeletonify-loading ${animate ? 'skeletonify-animate' : ''} skeletonify-variant-${variant} ${circle ? 'skeletonify-circle' : ''}`}
            style={customStyles}
            aria-busy="true"
            aria-live="polite"
            {...props}
        >
            {children}
        </div>
    ));

    return (
        <>
            {excludeStyles}
            {skeletonItems}
        </>
    );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
