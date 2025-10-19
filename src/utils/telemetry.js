const subscribers = new Map();

export const telemetry = {
  track(eventName, payload = {}) {
    const timestamp = new Date().toISOString();
    const event = { eventName, payload, timestamp };

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', eventName, payload);
    }

    const handlers = subscribers.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(`Telemetry handler for "${eventName}" failed`, error);
        }
      });
    }

    return event;
  },

  subscribe(eventName, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Telemetry handler must be a function');
    }

    const handlers = subscribers.get(eventName) || new Set();
    handlers.add(handler);
    subscribers.set(eventName, handlers);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        subscribers.delete(eventName);
      }
    };
  },
};

export const TELEMETRY_EVENTS = Object.freeze({
  COMPONENT_ADDED: 'component.added',
  COMPONENT_MOVED: 'component.moved',
  COMPONENT_REMOVED: 'component.removed',
  LAYOUT_SAVED: 'layout.saved',
  PREVIEW_TOGGLED: 'preview.toggled',
  CODE_EXPORTED: 'code.exported',
});
