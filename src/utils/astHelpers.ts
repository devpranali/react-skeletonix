import React, { CSSProperties } from "react";
import { SkeletonIgnore, SkeletonKeep, SkeletonUnite } from "../components/ControlComponents";
import { LIST_TAGS, TEXT_TAGS } from "../constants/tags";

export const isTextElement = (elementType: string): boolean => {
    return TEXT_TAGS.includes(elementType) || LIST_TAGS.includes(elementType);
};

export const isSkeletonIgnoreComponent = (element: any): boolean => element === SkeletonIgnore;
export const isSkeletonKeepComponent = (element: any): boolean => element === SkeletonKeep;
export const isSkeletonUniteComponent = (element: any): boolean => element === SkeletonUnite;

export function createLeafNode(
    node: React.ReactElement<any>,
    className: string,
    style: CSSProperties
): React.ReactElement {
    return React.cloneElement(node, {
        ...node.props,
        className: className + (node.props.className ? ` ${node.props.className}` : ""),
        style: {
            ...style,
            ...node.props.style,
        },
    } as typeof node.props);
}

export function createNodeWrapper(
    node: React.ReactElement<any>,
    className: string,
    style: CSSProperties
) {
    if (!node) return null;

    return React.createElement(
        "div",
        {
            className: className + (node?.props?.className ? ` ${node?.props?.className}` : ""),
            style: {
                ...style,
                ...node?.props?.style,
            },
        },
        node
    );
}
