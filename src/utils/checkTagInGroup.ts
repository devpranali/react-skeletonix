import React from "react";
import { HtmlTagGroup, HTML_TAG_GROUPS } from "../constants/tags";
import * as TAGS from "../constants/tags";

export default function checkTagInGroup(
    tag: string,
    groups: HtmlTagGroup[]
): boolean {
    return groups.some((group) => {
        const groupTags = TAGS[group] as readonly string[];
        return groupTags.includes(tag);
    });
}
