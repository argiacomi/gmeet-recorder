import { createLogger } from '../logger';

const logger = createLogger();

export const XhrProxy = () => {
  let interceptors = {
    methods: []
  };

  return {
    initialize: () => {
      if (!window.XMLHttpRequest) return false;

      const originalOpen = window.XMLHttpRequest.prototype.open;
      const originalSend = window.XMLHttpRequest.prototype.send;

      window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
        for (const interceptor of interceptors.methods) {
          if (url.startsWith(interceptor.url)) {
            this.__interceptedURL = url;
            this.__requestInterceptor = interceptor.requestCallback;
            this.__responseInterceptor = interceptor.responseCallback;
            break;
          }
        }
        originalOpen.apply(this, [method, url, ...args]);
      };

      window.XMLHttpRequest.prototype.send = function (data, ...args) {
        if (this.__interceptedURL) {
          try {
            this.__requestInterceptor(data);
          } catch (error) {
            logger.error('[XhrProxy]: ', error);
          }
        }

        originalSend.apply(this, [data, ...args]);

        this.addEventListener('readystatechange', () => {
          if (this.__interceptedURL && this.__responseInterceptor && this.readyState === XMLHttpRequest.DONE) {
            this.__responseInterceptor(this.responseText);
          }
        });
      };

      return true;
    },
    register: (newInterceptors) => {
      interceptors = {
        methods: [...interceptors.methods, ...newInterceptors.methods]
      };
    }
  };
};
