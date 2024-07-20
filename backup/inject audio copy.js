const START_AUDIO_ID = 1e3;
const DEBUG_MODE = true;

const createRepo = () => {
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

const WebRtcProxy = (config) => {
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
            console.log('[WebRtcProxy] Creating data channel with args', arguments);
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
            console.log('[WebRtcProxy]: ', error);
          }
        };
      }

      window.RTCPeerConnection = function (configuration, constraints) {
        const peerConnection = new OriginalRTCPeerConnection(configuration, constraints);

        if (config?.debug) {
          console.log('[WebRtcProxy] Created peer connection', peerConnection);
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

const RtcSenderProxy = (config) => {
  let trackReplaceHandler = null;

  return {
    initialize: () => {
      if (!window.RTCRtpSender) return false;

      const originalReplaceTrack = window.RTCRtpSender.prototype.replaceTrack;

      window.RTCRtpSender.prototype.replaceTrack = function (newTrack) {
        if (config?.debug) {
          console.log('[RtcSenderProxy] Replacing track', newTrack);
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

const GoogleMeets = (audioChunks, webRtcProxy, rtcSenderProxy, isDebugMode = false) => {
  let audioDestination, audioContext, audioRecorder;
  let audioChunkId = START_AUDIO_ID;

  const audioStreams = [];
  const localStreams = [];

  const addStreamToDestination = (stream) => {
    if (!audioContext) {
      console.error('[GoogleMeets/AddStream] addStreamToDestination no audio context');
      return;
    }
    if (isDebugMode) console.log('[GoogleMeets/AddStream] addStreamToDestination stream::', stream);

    if (stream.getAudioTracks().length === 0) {
      if (isDebugMode) console.log("[GoogleMeets/AddStream] stream doesn't have audio tracks stream::", stream.id);
      return;
    }

    if (!audioDestination) {
      console.error('[GoogleMeets/AddStream] addStreamToDestination no audio destination');
      return;
    }

    audioContext.createMediaStreamSource(stream).connect(audioDestination);
  };

  const handleTrackEvent = (peerConnection, event) => {
    if (event.streams.length === 0 || peerConnection.connectionState === 'closed') return;
    if (isDebugMode) console.log('[GoogleMeets/HandleTrack] peerConnection: ', peerConnection);
    if (isDebugMode) console.log('[GoogleMeets/HandleTrack] track event: ', event);

    for (const stream of event.streams) {
      if (stream.getAudioTracks().length > 0) {
        audioStreams.push(stream);
        addStreamToDestination(stream);
      }
    }
  };

  const handleTrackReplacement = (track) => {
    const newStream = new MediaStream();
    newStream.addTrack(track);
    audioStreams.push(newStream);
    localStreams.push(newStream);
    addStreamToDestination(newStream);
  };

  const handleAudioData = (event) => {
    audioChunks.set(audioChunkId++, event.data);
  };

  const startWebRTCRecorder = (timeslice) => {
    try {
      if (!audioContext) {
        console.error('[GoogleMeets/StartWebRTC] WebRTC has no audio context');
        return false;
      }

      audioDestination = audioContext.createMediaStreamDestination();
      if (isDebugMode) console.log('[GoogleMeets/StartWebRTC] audio destination created: ', audioDestination);

      audioStreams.forEach(addStreamToDestination);
      startAudioRecording(timeslice);
      return true;
    } catch (error) {
      console.error('[GoogleMeets/StartWebRTC]: ', error);
      return false;
    }
  };

  const startAudioRecording = async (timeslice) => {
    if (!audioContext) {
      console.error('[GoogleMeets/StartAudio] no audio context');
      return;
    }

    try {
      if (audioContext.state !== 'running') {
        console.warn('[GoogleMeets/StartAudio] audio context is not running. trying to wake it up');
        await audioContext.resume();
      }

      audioRecorder = new MediaRecorder(audioDestination.stream, {
        mimeType: 'audio/webm'
      });

      audioRecorder.ondataavailable = (event) => handleAudioData(event);
      audioRecorder.onstop = () => {
        console.log('[GoogleMeets/StopAudio] audio recorder stopping');
        const blob = new Blob(audioChunks.toArray(), { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const filename = `recording_${new Date().toISOString()}.webm`;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('[GoogleMeets] Audio Recording saved with file name: ', filename);
      };

      if (audioChunkId !== START_AUDIO_ID) {
        console.error(
          `[GoogleMeets/StartAudio] audio id is not correct, got: ${audioChunkId} expected: ${START_AUDIO_ID}`
        );

        audioChunks.set(audioChunkId, header);
        audioChunkId++;
      }

      audioRecorder.start(timeslice);
      console.log('[GoogleMeets/StartAudio] audio recorder started');
    } catch (error) {
      console.error('[GoogleMeets/StartAudio] web-stenographer start audio recording failed: ', error);
    }
  };

  const startHTMLRecorder = (timeslice) => {
    const audioElements = document.getElementsByTagName('audio');

    if (audioElements.length === 0) {
      throw new Error('No audio elements found on page');
    }

    if (!audioContext) {
      throw new Error('No audio context');
    }

    audioDestination = audioContext.createMediaStreamDestination();
    localStreams.forEach(addStreamToDestination);

    for (const audioElement of audioElements) {
      const stream = audioElement.srcObject;
      audioContext.createMediaStreamSource(stream).connect(audioDestination);
    }

    startAudioRecording(timeslice);
    return true;
  };

  return {
    initialize: () => {
      try {
        rtcSenderProxy.initialize();
        rtcSenderProxy.register({
          onReplaceTrack: handleTrackReplacement
        });

        const webRtcInitialized = webRtcProxy.initialize();
        webRtcProxy.register({
          logChannelArgs: true,
          peerMessages: [{ event: 'track', callback: handleTrackEvent }],
          channelListeners: []
        });

        const proxyCheckMeta = document.createElement('meta');
        proxyCheckMeta.setAttribute('id', 'dg-proxy-check');
        proxyCheckMeta.setAttribute('name', 'hasCreatedProxies');
        proxyCheckMeta.setAttribute('content', String(webRtcInitialized));
        (document.head || document.documentElement).prepend(proxyCheckMeta);

        window.addEventListener('load', () => {
          console.log('[GoogleMeets] Audio::window load event');
          audioContext = new AudioContext();
          window.dg_audio_context = audioContext;
        });
      } catch (error) {
        console.error('[GoogleMeets] initialization failed with error: ', error);
      }
    },

    startRecorder: (timeslice, mode = 'webrtc') => {
      console.log(`[GoogleMeets/StartRecorder] stenographer: start recorder::${mode}`);
      switch (mode) {
        case 'webrtc':
          return startWebRTCRecorder(timeslice);
        case 'html':
          return startHTMLRecorder(timeslice);
        default:
          console.error(`[GoogleMeets/StartRecorder] Unsupported recorder mode: ${mode}`);
          return false;
      }
    },

    stopRecorder: () => {
      if (audioRecorder && audioRecorder.state === 'recording') {
        console.log('[GoogleMeets/StopRecorder] Stopping Media Recorder');
        audioRecorder.stop();
        audioRecorder.stream.getTracks().forEach((track) => {
          console.log('[GoogleMeets/StopRecorder] Stopping track:', track.kind);
          track.stop();
        });
      } else {
        console.log('[GoogleMeets/StopRecorder] MediaRecorder not recording');
      }
    }
  };
};

const initializeStenographer = () => {
  if (window.has_injected_stenographer) {
    console.log('[Stenographer] Stenographer already initialized');
    return;
  }

  window.has_injected_stenographer = true;

  const audioChunkRepo = createRepo();

  const googleMeets = GoogleMeets(audioChunkRepo, WebRtcProxy(), RtcSenderProxy(), true);
  console.log(`[Stenographer] Stenographer initialized at: ${Date.now()}`);
  googleMeets.initialize();

  window.googleMeets = googleMeets;
};

initializeStenographer();

window.addEventListener(
  'message',
  (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'START_RECORDING') {
      console.log('[Stenographer] Start recording requested');
      window.googleMeets.startRecorder(1000, 'webrtc');
    }
  },
  false
);

window.addEventListener(
  'message',
  (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'STOP_RECORDING') {
      console.log('[Stenographer] Stop recording requested');
      window.googleMeets.stopRecorder();
    }
  },
  false
);
