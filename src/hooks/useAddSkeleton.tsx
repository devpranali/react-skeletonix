import React from "react";
import checkTagInGroup from "../utils/checkTagInGroup";
import {
    isTextElement,
    isSkeletonIgnoreComponent,
    isSkeletonKeepComponent,
    isSkeletonUniteComponent,
    createLeafNode,
    createNodeWrapper,
} from "../utils/astHelpers";
import { HtmlTagGroup } from "../constants/tags";

export interface AstSkeletonConfig {
    className?: string; // e.g. "skeletonify-loading skeletonify-variant-shimmer ..."
    style?: React.CSSProperties; // Global injected styles like random widths etc
    exceptTags?: string[];
    exceptTagGroups?: HtmlTagGroup[];
}

export default function useAddSkeleton(config: AstSkeletonConfig) {
    const { className = "", style = {}, exceptTags = [], exceptTagGroups = [] } = config;

    const addSkeleton = (node: React.ReactNode): React.ReactNode => {
        if (!React.isValidElement(node)) {
            // Text nodes or numbers: Wrap in a generic div with our class
            return createNodeWrapper(node as any, className, style);
        }

        const element = node as React.ReactElement<any>;
        const { children } = element.props;
        const elementType = element.type;

        // --- 1. Control Components ---
        if (isSkeletonKeepComponent(elementType)) return element;
        if (isSkeletonIgnoreComponent(elementType)) return null;
        if (isSkeletonUniteComponent(elementType)) {
            // Unite turns this entire element structure into one solid block
            return createLeafNode(element, className + " skeletonify-container-mode", style);
        }

        // --- 2. Exclusions ---
        if (typeof elementType === "string") {
            if (exceptTags.includes(elementType)) return element;
            if (checkTagInGroup(elementType, exceptTagGroups)) return element;
        }

        // --- 3. Component Unpacking ---
        if (typeof elementType === "function") {
            // This is a custom React Component. We must render it to see what HTML it produces.
            const rendered = (elementType as any)(element.props);
            return addSkeleton(rendered);
        }

        const hasChildren = React.Children.count(children) > 0;
        const isValidChildren = typeof children !== "string" && typeof children !== "number";

        // --- 4. Tag Specific Logic ---
        if (typeof elementType === "string" && isTextElement(elementType)) {
            // Text tags (p, h1, span) with children should just become shivering blocks directly
            // We inject our classes right onto the existing tag so it keeps its native margins/fonts
            return createLeafNode(element, className, style);
        }

        if (elementType === "img" || elementType === "svg" || elementType === "video") {
            return createNodeWrapper(element, className, style);
        }

        // --- 5. Recursive Traversal ---
        if (hasChildren && isValidChildren) {
            const childWithSkeletons = React.Children.map(children, addSkeleton);

            return React.cloneElement(element, {
                ...element.props,
                children: childWithSkeletons,
            } as typeof element.props);
        }

        // --- 6. Fallback Leaf ---
        return createLeafNode(element, className, style);
    };

    return addSkeleton;
}
