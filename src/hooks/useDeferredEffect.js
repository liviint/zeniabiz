import { useEffect } from "react";
import { InteractionManager } from "react-native";

export function useDeferredEffect(effect, deps = [], options = {}) {
     const { enabled = true } = options;
    useEffect(() => {
        if (!enabled) return;
        
        let isMounted = true;

        const task = InteractionManager.runAfterInteractions(async () => {
            if (!isMounted) return;

            try {
                await effect(() => isMounted);
            } catch (error) {
                console.error(error);
            }
        });

        return () => {
            isMounted = false;
            task.cancel();
        };
    }, deps);
}