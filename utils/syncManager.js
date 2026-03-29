const listeners = {};

export const syncManager = {
    on(event, cb) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);

        return () => {
        listeners[event] = listeners[event].filter(fn => fn !== cb);
        };
    },

    emit(event) {
        (listeners[event] || []).forEach(cb => cb());
    }
};
