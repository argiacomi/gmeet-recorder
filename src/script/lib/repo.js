export const createRepo = () => {
  const store = new Map();
  const subscribers = new Map();
  let nextSubscriberId = 23484;

  return {
    set: (key, value) => {
      store.set(key, value);
      subscribers.forEach((callback) => callback(value));
    },

    get: (key) => store.get(key),

    has: (key) => store.has(key),

    toArray: () => Array.from(store.values()),

    size: () => store.size,

    subscribe: (callback) => {
      const id = nextSubscriberId++;
      subscribers.set(id, callback);
      return id;
    },

    unsubscribe: (id) => {
      subscribers.delete(id);
    },

    getKeys: () => Array.from(store.keys())
  };
};
