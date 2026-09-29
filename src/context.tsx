import * as React from 'react';
import { INERT_PROP, cx } from './utils/react';

export interface SkeletonState {
    /** `true` while this component is inside a loading <Skeleton>. */
    loading: boolean;
}

interface InternalState extends SkeletonState {
    className: string;
    vars: Record<string, string>;
}

const NOT_LOADING: InternalState = { loading: false, className: '', vars: {} };

export const SkeletonStateContext = React.createContext<InternalState>(NOT_LOADING);

/**
 * Tells a component whether it is rendered inside a loading <Skeleton>, e.g.
 * to show placeholder text: `{loading ? 'Placeholder name' : user.name}`.
 */
export function useSkeleton(): SkeletonState {
    return { loading: React.useContext(SkeletonStateContext).loading };
}

export interface SkeletonScopeProps {
    children?: React.ReactNode;
}

/**
 * Applies the nearest loading skeleton to content rendered elsewhere in the
 * DOM, such as a portal (dropdowns, modals, tooltips):
 *
 *   createPortal(<SkeletonScope><Menu /></SkeletonScope>, document.body)
 *
 * Renders its children unchanged when no skeleton is loading.
 */
export const SkeletonScope: React.FC<SkeletonScopeProps> = ({ children }) => {
    const state = React.useContext(SkeletonStateContext);
    return (
        <div
            className={state.loading ? cx('skx-wrapper', state.className) : 'skx-wrapper'}
            style={state.loading ? (state.vars as React.CSSProperties) : undefined}
            {...(state.loading ? { 'aria-busy': true, ...INERT_PROP } : {})}
        >
            {children}
        </div>
    );
};
SkeletonScope.displayName = 'SkeletonScope';
