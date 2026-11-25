
import { useEffect } from "react";

export function useDeferredEffect(effect, deps = [], options = {}) {
    const { enabled = true } = options;

    useEffect(() => {
        if (!enabled) return;

        let isMounted = true;

        const task = requestIdleCallback(async () => {
            if (!isMounted) return;

            try {
                await effect(() => isMounted);
            } catch (error) {
                console.error(error);
            }
        });

        return () => {
            isMounted = false;
            cancelIdleCallback(task);
        };
    }, [...deps, enabled]);
}
