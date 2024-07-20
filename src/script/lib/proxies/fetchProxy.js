import { createLogger } from '../logger';

const logger = createLogger();

export const FetchProxy = (config) => {
  let interceptors = [];

  return {
    initialize: () => {
      if (!window.fetch) return false;

      if (config?.debug) {
        logger.debug('[FetchProxy] FetchProxy initialized');
      }

      const originalFetch = window.fetch;

      window.fetch = function (...args) {
        return new Promise((resolve, reject) => {
          originalFetch
            .apply(this, args)
            .then((response) => {
              for (const interceptor of interceptors) {
                if (response.url === interceptor.url) {
                  try {
                    const clonedResponse = response.clone();
                    interceptor.callback(clonedResponse);
                  } catch (error) {
                    logger.error('[FetchProxy] Failed calling interceptor for fetch with error', error);
                  }
                }
              }
              resolve(response);
            })
            .catch((error) => {
              reject(error);
            });
        });
      };

      return true;
    },
    register: (newInterceptors) => {
      interceptors = [...interceptors, ...newInterceptors];
    }
  };
};
