import { createLogger } from '../logger';

const logger = createLogger();

export const RtcSenderProxy = (config) => {
  let trackReplaceHandler = null;

  return {
    initialize: () => {
      if (!window.RTCRtpSender) return false;

      const originalReplaceTrack = window.RTCRtpSender.prototype.replaceTrack;

      window.RTCRtpSender.prototype.replaceTrack = function (newTrack) {
        if (config?.debug) {
          logger.debug('[RtcSenderProxy] Replacing track', newTrack);
        }

        if (trackReplaceHandler?.onReplaceTrack) {
          trackReplaceHandler.onReplaceTrack(newTrack);
        }

        return originalReplaceTrack.apply(this, arguments);
      };

      return true;
    },
    register: (handler) => {
      trackReplaceHandler = handler;
    }
  };
};
