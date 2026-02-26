import React from "react";

// The Control Components simply act as markers for our AST parser
// They don't actually render any extra DOM themselves by default.

interface ControlProps {
    children?: React.ReactNode;
}

export const SkeletonIgnore: React.FC<ControlProps> = ({ children }) => {
    return <>{children}</>;
};

export const SkeletonKeep: React.FC<ControlProps> = ({ children }) => {
    return <>{children}</>;
};

export const SkeletonUnite: React.FC<ControlProps> = ({ children }) => {
    return <>{children}</>;
};
