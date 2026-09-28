import * as React from 'react';

export type AnyRef<T> = React.Ref<T> | undefined;

/** Join class names, dropping empty values. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
    parts.filter(Boolean).join(' ');

export function assignRef<T>(ref: AnyRef<T>, value: T | null): void {
    if (!ref) return;
    if (typeof ref === 'function') ref(value);
    else (ref as React.MutableRefObject<T | null>).current = value;
}

export function mergeRefs<T>(...refs: Array<AnyRef<T>>): React.RefCallback<T> {
    return (value) => refs.forEach((ref) => assignRef(ref, value));
}

const REACT_MAJOR = parseInt(React.version, 10);

/** `inert` is a boolean prop from React 19; older versions need a string. */
export const INERT_PROP: Record<string, unknown> = { inert: REACT_MAJOR >= 19 ? true : '' };

/** Reads an element's own ref in a way that works on React 16-19. */
export function getElementRef(element: React.ReactElement): AnyRef<unknown> {
    if (REACT_MAJOR >= 19) return (element.props as { ref?: AnyRef<unknown> }).ref;
    return (element as unknown as { ref?: AnyRef<unknown> }).ref;
}

export const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/** Normalizes `data` so both a single item and a list are accepted. */
export function toArray<T>(data: T | T[] | null | undefined): T[] {
    if (data === null || data === undefined) return [];
    return Array.isArray(data) ? data : [data];
}

/** Keeps a user-provided key; falls back to the index. */
export function withKey(node: React.ReactNode, index: number): React.ReactNode {
    if (React.isValidElement(node)) {
        return node.key !== null ? node : React.cloneElement(node, { key: index });
    }
    return React.createElement(React.Fragment, { key: index }, node);
}

/** A single host element such as <div>, <tr> or <my-element>. */
export function isHostElement(node: React.ReactNode): node is React.ReactElement<Record<string, any>> {
    return React.isValidElement(node) && typeof node.type === 'string';
}
