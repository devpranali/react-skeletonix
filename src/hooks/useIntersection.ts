import { useState, useEffect, RefObject } from 'react';

interface UseIntersectionOptions extends IntersectionObserverInit {
    enabled?: boolean;
}

export function useIntersection(
    ref: RefObject<HTMLElement>,
    options: UseIntersectionOptions = {}
) {
    const { enabled = true, ...observerOptions } = options;
    const [isIntersecting, setIsIntersecting] = useState(!enabled);

    useEffect(() => {
        if (!enabled || !ref.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, observerOptions);

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [ref, enabled, JSON.stringify(observerOptions)]);

    return isIntersecting;
}

export default useIntersection;
