import * as React from "react";

// Control components render a `display: contents` marker element, so they
// work in every mode, never affect layout, and are recognised by the
// stylesheet through their data-skeleton attribute (no identity checks).

interface ControlProps {
    children?: React.ReactNode;
}

const marker = (tag: string, kind: string, displayName: string): React.FC<ControlProps> => {
    const Component: React.FC<ControlProps> = ({ children }) =>
        React.createElement(tag, { "data-skeleton": kind }, children);
    Component.displayName = displayName;
    return Component;
};

/** Hidden while loading, but keeps its space (no layout shift). */
export const SkeletonIgnore = marker("skx-ignore", "ignore", "SkeletonIgnore");

/** Shown exactly as it is while loading. */
export const SkeletonKeep = marker("skx-keep", "keep", "SkeletonKeep");

/** Each direct child becomes one solid skeleton block. */
export const SkeletonUnite = marker("skx-unite", "unite", "SkeletonUnite");
