import Skeleton, { SkeletonTheme } from './Skeleton';
import { SkeletonIgnore, SkeletonKeep, SkeletonUnite } from './components/ControlComponents';
import { SkeletonScope, useSkeleton } from './context';

export default Skeleton;
export { Skeleton, SkeletonTheme, SkeletonIgnore, SkeletonKeep, SkeletonUnite, SkeletonScope, useSkeleton };
export type {
    SkeletonProps,
    SkeletonOptions,
    SkeletonThemeProps,
    SkeletonVariant,
    SkeletonColorScheme,
} from './Skeleton';
export type { SkeletonState, SkeletonScopeProps } from './context';
export type { HtmlTagGroup } from './constants/tags';
