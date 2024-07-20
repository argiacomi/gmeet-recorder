import { createLogger } from '../logger';

const logger = createLogger();

export const WebRtcProxy = (config) => {
  let proxyConfig = {
    peerMessages: [],
    logChannelArgs: false,
    channelListeners: []
  };

  return {
    initialize: () => {
      if (!window.RTCPeerConnection) return false;

      window.dg_channels = window.dg_channels || {};

      const OriginalRTCPeerConnection = window.RTCPeerConnection;
      const originalCreateDataChannel = OriginalRTCPeerConnection.prototype.createDataChannel;

      if (originalCreateDataChannel) {
        OriginalRTCPeerConnection.prototype.createDataChannel = function () {
          if (proxyConfig.logChannelArgs) {
            logger.debug('[WebRtcProxy] Creating data channel with args', arguments);
          }

          try {
            const dataChannel = originalCreateDataChannel.apply(this, arguments);
            if (dataChannel && proxyConfig.channelListeners.length > 0) {
              const listener = proxyConfig.channelListeners.find((l) => l.label === dataChannel.label);
              if (listener) {
                dataChannel.addEventListener('message', listener.callback);
                if (listener.monitor) listener.monitor(dataChannel);
                window.dg_channels[dataChannel.label] = dataChannel;
              }
            }
            return dataChannel;
          } catch (error) {
            logger.debug('[WebRtcProxy]: ', error);
          }
        };
      }

      window.RTCPeerConnection = function (configuration, constraints) {
        const peerConnection = new OriginalRTCPeerConnection(configuration, constraints);

        if (config?.debug) {
          logger.debug('[WebRtcProxy] Created peer connection', peerConnection);
        }

        for (const listener of proxyConfig.peerMessages) {
          peerConnection.addEventListener(listener.event, (event) => {
            listener.callback(peerConnection, event);
          });
        }

        return peerConnection;
      };

      window.RTCPeerConnection.prototype = OriginalRTCPeerConnection.prototype;
      return true;
    },
    register: (newConfig) => {
      proxyConfig = {
        peerMessages: [...proxyConfig.peerMessages, ...newConfig.peerMessages],
        logChannelArgs: newConfig.logChannelArgs,
        channelListeners: [...proxyConfig.channelListeners, ...newConfig.channelListeners]
      };
    }
  };
};
