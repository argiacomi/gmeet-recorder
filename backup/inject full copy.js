const START_AUDIO_ID = 1e3;
const DEBUG_MODE = true;
let data = [];

const createRepo = () => {
  const store = new Map();
  const subscribers = new Map();
  let nextSubscriberId = 23484;

  return {
    /**
     * Sets a value in the repository and notifies subscribers.
     * @param {any} key - The key to set.
     * @param {any} value - The value to set.
     */
    set: (key, value) => {
      store.set(key, value);
      subscribers.forEach((callback) => callback(value));
    },

    /**
     * Gets a value from the repository.
     * @param {any} key - The key to get.
     * @returns {any} The value associated with the key.
     */
    get: (key) => store.get(key),

    /**
     * Checks if a key exists in the repository.
     * @param {any} key - The key to check.
     * @returns {boolean} True if the key exists, false otherwise.
     */
    has: (key) => store.has(key),

    /**
     * Converts the repository to an array of values.
     * @returns {Array} An array of all values in the repository.
     */
    toArray: () => Array.from(store.values()),

    /**
     * Gets the size of the repository.
     * @returns {number} The number of entries in the repository.
     */
    size: () => store.size,

    /**
     * Subscribes to changes in the repository.
     * @param {Function} callback - The function to call when a change occurs.
     * @returns {number} A unique subscriber ID.
     */
    subscribe: (callback) => {
      const id = nextSubscriberId++;
      subscribers.set(id, callback);
      return id;
    },

    /**
     * Unsubscribes from changes in the repository.
     * @param {number} id - The subscriber ID to unsubscribe.
     */
    unsubscribe: (id) => {
      subscribers.delete(id);
    },

    /**
     * Gets an array of all keys in the repository.
     * @returns {Array} An array of all keys in the repository.
     */
    getKeys: () => Array.from(store.keys())
  };
};

const FetchProxy = (config) => {
  let interceptors = [];

  return {
    initialize: () => {
      if (!window.fetch) return false;

      if (config?.debug) {
        console.log('[FetchProxy] FetchProxy initialized');
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
                    console.error('[FetchProxy] Failed calling interceptor for fetch with error', error);
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

const XhrProxy = (config) => {
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
            console.error('[XhrProxy]: ', error);
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

const GoogleMeets = (
  userMap,
  captionMap,
  audioChunks,
  chatMap,
  webRtcProxy,
  fetchProxy,
  rtcSenderProxy,
  isDebugMode = false
) => {
  let audioDestination, audioContext, mediaRecorder;
  let dataChannelId = 2643;
  let isStopCaptionsRequested = false;
  let captionsChannel = null;
  let audioChunkId = START_AUDIO_ID;
  let meetingMetadata = null;

  const audioStreams = [];
  const lastMessageIds = new Map();
  const xhrProxy = XhrProxy();
  let calendarMetadata = null;
  let fallbackMetadata = null;

  // const notifier = DefaultNotifier();
  const localStreams = [];

  const handleCollectionMessage = (message) => {
    if (isDebugMode) console.log('[GoogleMeets/Collection] collection message: ', message);

    // const unzippedData = unzip(message.data);
    // const collectionMessage = CollectionMessage.decode(unzippedData);

    // if (collectionMessage.body?.wrapper?.wrapper) {
    //   if (collectionMessage.body.wrapper.wrapper.chat) {
    //     const chatMessages = collectionMessage.body.wrapper.wrapper.chat;
    //     for (const chat of chatMessages) {
    //       const user = userMap.get(chat.body.deviceId);
    //       chatMap.set(chat.body.messageId, {
    //         ...chat.body,
    //         user: {
    //           name: user?.name ?? '',
    //           fullName: user?.fullName ?? '',
    //           image: user?.image ?? '',
    //           id: user?.id ?? ''
    //         }
    //       });
    //     }
    //   }

    //   if (collectionMessage.body.wrapper.wrapper.wrapper?.userDetails) {
    //     const userDetails = collectionMessage.body.wrapper.wrapper.wrapper.userDetails;
    //     if (userDetails) {
    //       for (const user of userDetails) {
    //         userMap.set(user.deviceId, {
    //           id: user.deviceId,
    //           name: user.name,
    //           fullName: user.fullName,
    //           image: user.profile
    //         });
    //       }
    //     }
    //   }
    // }
  };

  const handleDataChannelMessage = (peerConnection, event) => {
    if (event.channel.label === 'collections') {
      window.proxyPeerConnection = peerConnection;
      if (isDebugMode) console.log('[GoogleMeets/Channel] data channel message: ', event);
      event.channel.addEventListener('message', handleCollectionMessage);
    }
  };

  let nextCaptionId = 65110;
  const captionIdQueue = [];
  const captionIdMap = new Map();

  const handleCaptionMessage = (event) => {
    if (isDebugMode) console.log('[GoogleMeets/Caption] handle caption message: ', event);
    try {
      // const unzippedData = unzip(event.data);
      // const captionWrapper = CaptionWrapper.decode(unzippedData);
      // if (captionWrapper.unknown !== '') {
      //   console.log('unknown data found: ', Buffer.from(unzippedData).toString('hex'));
      //   return;
      // }
      // if (captionIdQueue.length > 50) {
      //   const oldestId = captionIdQueue.shift();
      //   captionIdMap.delete(oldestId);
      // }
      // const captionKey = `${captionWrapper.caption.captionId}/${captionWrapper.caption.deviceSpace}`;
      // let captionId = captionIdMap.get(captionKey);
      // if (!captionId) {
      //   captionId = nextCaptionId++;
      //   captionIdQueue.push(captionKey);
      //   captionIdMap.set(captionKey, captionId);
      // }
      // const existingCaption = captionMap.has(captionId);
      // const user = userMap.get(captionWrapper.caption.deviceSpace);
      // const lastMessageId = lastMessageIds.get(user.id) || -1;
      // if (captionId > lastMessageId) {
      //   lastMessageIds.set(user.id, captionId);
      // }
      // let updatedCaption;
      // if (existingCaption) {
      //   const existingCaptionData = captionMap.get(captionId);
      //   let endTimestamp = Date.now();
      //   if (existingCaptionData.messageId < lastMessageId) {
      //     endTimestamp = existingCaptionData.endTs;
      //   }
      //   updatedCaption = {
      //     ...existingCaptionData,
      //     endTs: endTimestamp,
      //     caption: captionWrapper.caption.caption,
      //     sequence: captionWrapper.caption.version,
      //     updatedAt: Date.now()
      //   };
      // } else {
      //   updatedCaption = {
      //     messageId: captionId,
      //     receivedCaptionId: captionWrapper.caption.captionId,
      //     caption: captionWrapper.caption.caption,
      //     sequence: captionWrapper.caption.version,
      //     firstReceiveTs: Date.now(),
      //     updatedAt: Date.now(),
      //     endTs: Date.now(),
      //     user: {
      //       id: user.id,
      //       name: user.name,
      //       fullName: user.fullName,
      //       image: user.image
      //     }
      //   };
      // }
      // captionMap.set(captionWrapper.caption.captionId, updatedCaption);
    } catch (error) {
      console.error('[GoogleMeets/Caption]: ', error);
      // const errorMessage = `${error.message} ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, `CaptionMessage ${errorMessage}`);
    }
  };

  const syncMeetingSpaceCollections = async (response) => {
    if (isDebugMode) console.log('[GoogleMeets/MeetingSpace] sync meeting space collections: extraction start');

    try {
      const text = await response.text();
      const decodedData = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
      console.log('[GoogleMeets/MeetingSpace] decoded data:', decodedData);
      // const meetingSpaceCollection = MeetingSpaceCollectionResponse.decode(decodedData);

      // if (meetingSpaceCollection.spaces?.wrapper?.userDetails) {
      //   const userDetails = meetingSpaceCollection.spaces.wrapper.userDetails;
      //   for (const user of userDetails) {
      //     userMap.set(user.deviceId, {
      //       id: user.deviceId,
      //       name: user.name,
      //       fullName: user.fullName,
      //       image: user.profile
      //     });
      //   }
      // }
    } catch (error) {
      console.error('[GoogleMeets/MeetingSpace]: ', error);
      // const errorMessage = `${error.message} ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, `SyncMeetingSpaceCollection ${errorMessage}`);
    }
  };

  const captureSentComment = async (response) => {
    if (isDebugMode) console.log('[GoogleMeets/CaptureSent] trying to capture sent comment data');

    try {
      const text = await response.text();
      const decodedData = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
      console.log('[GoogleMeets/CaptureSent] decoded data:', decodedData);
      // const chatData = ChatData.decode(decodedData);

      // if (!chatData) return;

      // const user = userMap.get(chatData.deviceId);
      // chatMap.set(chatData.messageId, {
      //   ...chatData,
      //   user: {
      //     name: user?.name ?? '',
      //     fullName: user?.fullName ?? '',
      //     image: user?.image ?? '',
      //     id: user?.id ?? ''
      //   }
      // });
    } catch (error) {
      console.error('[GoogleMeets/CaptureSent]: ', error);
      // const errorMessage = `${error.message} ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, `SendComment ${errorMessage}`);
    }
  };

  const resolveMeeting = async (response) => {
    if (isDebugMode) console.log('[GoogleMeets/Resolve] trying to resolve meeting data: ', response);

    try {
      const text = await response.text();
      // const decodedData = Buffer.from(text, 'base64');
      console.log('[GoogleMeets/Resolve] resolveMeeting text: ', text);
      // const resolvedMeeting = ResolveMeeting.decode(Uint8Array.from(decodedData));

      // fallbackMetadata = {
      //   kind: 'fallback',
      //   summary: resolvedMeeting.title,
      //   hangoutLink: resolvedMeeting.hangoutsUrl
      // };
    } catch (error) {
      console.error('[GoogleMeets/Resolve]: ', error);
      // const errorMessage = `${error.message} ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, `ResolveMeeting ${errorMessage}`);
    }
  };

  const monitorCaptionsChannel = (channel) => {
    if (isDebugMode) console.log('[GoogleMeets/MonitorCaptions] monitoring captions channel: ', channel);

    if (isStopCaptionsRequested) return;

    if (channel.readyState === 'closing' || channel.readyState === 'closed') {
      startCaptionsService();
    } else {
      setTimeout(() => monitorCaptionsChannel(channel), 1000);
    }
  };

  const startCaptionsService = () => {
    if (!window.proxyPeerConnection) {
      console.error('[GoogleMeets/StartCaption] no proxy peer connection found');
      // notifier.notify(WEB_STENOGRAPHER_ERROR, 'stCaptionService NoProxyPeerConnection');
      return;
    }
    if (isDebugMode) console.log('[GoogleMeets] starting captions service: ', window.proxyPeerConnection);

    isStopCaptionsRequested = false;

    const disconnectedStates = ['disconnected', 'failed', 'closed'];
    if (!disconnectedStates.includes(window.proxyPeerConnection.connectionState)) {
      window.proxyPeerConnection.createDataChannel('captions', {
        ordered: true,
        maxRetransmits: 100,
        id: dataChannelId++
      });
    }
  };

  const addStreamToDestination = (stream) => {
    if (!audioContext) {
      console.error('[GoogleMeets/AddStream] addStreamToDestination no audio context');
      // notifier.notify(WEB_STENOGRAPHER_ERROR, 'addStreamToDestination no audio context');
      return;
    }
    if (isDebugMode) console.log('[GoogleMeets/AddStream] addStreamToDestination stream::', stream);

    if (stream.getAudioTracks().length === 0) {
      if (isDebugMode) console.log("[GoogleMeets/AddStream] stream doesn't have audio tracks stream::", stream.id);
      return;
    }

    if (!audioDestination) {
      console.error('[GoogleMeets/AddStream] addStreamToDestination no audio destination');
      // notifier.notify(WEB_STENOGRAPHER_ERROR, 'addStreamToDestination no audio destination');
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
        // notifier.notify(WEB_STENOGRAPHER_ERROR, 'WebRTC has no audio context');
        return false;
      }

      audioDestination = audioContext.createMediaStreamDestination();
      if (isDebugMode) console.log('[GoogleMeets/StartWebRTC] audio destination created: ', audioDestination);

      audioStreams.forEach(addStreamToDestination);
      startAudioRecording(timeslice);
      return true;
    } catch (error) {
      console.error('[GoogleMeets/StartWebRTC]: ', error);
      // const errorMessage = `${error.message} ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, `WebRTC::AUR ${errorMessage}`);
      return false;
    }
  };

  const startAudioRecording = async (timeslice) => {
    if (!audioContext) {
      console.error('[GoogleMeets/StartAudio] no audio context');
      // notifier.notify(WEB_STENOGRAPHER_ERROR, 'no audio context');
      return;
    }

    try {
      if (audioContext.state !== 'running') {
        console.warn('[GoogleMeets/StartAudio] audio context is not running. trying to wake it up');
        // notifier.notify(
        //   WEB_STENOGRAPHER_ERROR,
        //   'audio context is not running. trying to wake it up'
        // );
        await audioContext.resume();
      }

      mediaRecorder = new MediaRecorder(audioDestination.stream, {
        mimeType: 'audio/webm'
      });

      // mediaRecorder.addEventListener('dataavailable', handleAudioData);
      mediaRecorder.ondataavailable = (event) => handleAudioData(event);
      mediaRecorder.onstop = () => {
        console.log('[GoogleMeets/StopAudio] audio recorder stopping');
        console.log(audioChunks.size());
        console.log(audioChunks);
        console.log(audioChunks.toArray());
        const blob = new Blob(audioChunks.toArray(), { type: 'audio/webm' });
        console.log(1);
        const url = URL.createObjectURL(blob);
        console.log(2);
        const filename = `recording_${new Date().toISOString()}.webm`;
        console.log(3);
        const a = document.createElement('a');
        console.log(4);
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        console.log(5);
        document.body.appendChild(a);
        console.log(6);
        a.click();
        console.log(7);
        window.URL.revokeObjectURL(url);
        console.log(8);
        document.body.removeChild(a);
        console.log(9);
        console.log('[GoogleMeets] Audio Recording saved with file name: ', filename);
      };

      if (audioChunkId !== START_AUDIO_ID) {
        console.error(
          `[GoogleMeets/StartAudio] audio id is not correct, got: ${audioChunkId} expected: ${START_AUDIO_ID}`
        );

        // notifier.notify(
        //   WEB_STENOGRAPHER_ERROR,
        //   `audio id is not correct, got: ${audioChunkId} expected: ${START_AUDIO_ID}`
        // );

        const header = await getWebMHeader();
        const logMessage = `adding header to audio. header size: ${header?.size ?? 'unknown'} with id ${audioChunkId}`;
        console.log('[GoogleMeets/StartAudio]: ', logMessage);
        // notifier.notify(WEB_STENOGRAPHER_LOG, logMessage);

        audioChunks.set(audioChunkId, header);
        audioChunkId++;
      }

      mediaRecorder.start(timeslice);
      console.log('[GoogleMeets/StartAudio] audio recorder started');
      // notifier.notify(WEB_STENOGRAPHER_LOG, 'audio recorder started');
    } catch (error) {
      console.error('[GoogleMeets/StartAudio] web-stenographer start audio recording failed: ', error);
      // const errorMessage = `web-stenographer start audio recording failed: ${
      //   error.message
      // } ${error.stack.substring(0, 1000)}`;
      // notifier.notify(WEB_STENOGRAPHER_ERROR, errorMessage);
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

    // Process local streams
    localStreams.forEach(addStreamToDestination);

    // Process audio elements
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
          logChannelArgs: false,
          peerMessages: [
            { event: 'datachannel', callback: handleDataChannelMessage },
            { event: 'track', callback: handleTrackEvent }
          ],
          channelListeners: [{ label: 'captions', callback: handleCaptionMessage, monitor: monitorCaptionsChannel }]
        });

        const proxyCheckMeta = document.createElement('meta');
        proxyCheckMeta.setAttribute('id', 'dg-proxy-check');
        proxyCheckMeta.setAttribute('name', 'hasCreatedProxies');
        proxyCheckMeta.setAttribute('content', String(webRtcInitialized));
        (document.head || document.documentElement).prepend(proxyCheckMeta);

        window.addEventListener('load', () => {
          console.log('[GoogleMeets] Audio::window load event');
          // notifier.notify(WEB_STENOGRAPHER_LOG, 'Audio::window load event');
          audioContext = new AudioContext();
          window.dg_audio_context = audioContext;

          // Dispatch the custom event when dg_audio_context is set
          window.dispatchEvent('dgAudioContextSetEvent');
        });

        fetchProxy.initialize();
        fetchProxy.register([
          {
            url: 'https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingSpaceService/SyncMeetingSpaceCollections',
            callback: syncMeetingSpaceCollections
          },
          {
            url: 'https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingMessageService/CreateMeetingMessage',
            callback: captureSentComment
          },
          {
            url: 'https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingSpaceService/ResolveMeetingSpace',
            callback: resolveMeeting
          }
        ]);

        xhrProxy.initialize();
        xhrProxy.register({
          methods: [
            {
              url: 'https://clients6.google.com/calendar/v3/calendars',
              callback: () => {
                console.log('[GoogleMeets] received meeting meta data');
              },
              resp: (response) => {
                try {
                  calendarMetadata = JSON.parse(response);
                } catch (error) {
                  console.error('[GoogleMeets] Failed to parse calendar metadata:', error);
                }
              }
            }
          ]
        });
      } catch (error) {
        console.error('[GoogleMeets] initialization failed with error: ', error);
        // const errorMessage = `initializer failed with: ${error.message} ${error.stack.substring(
        //   0,
        //   1000
        // )}`;
        // notifier.notify(WEB_STENOGRAPHER_ERROR, errorMessage);
      }
    },

    startCaptionsService,

    stopCaptionsService: () => {
      isStopCaptionsRequested = true;
      if (captionsChannel) {
        captionsChannel.close();
        captionsChannel = null;
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
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        console.log('[GoogleMeets/StopRecorder] Calling mediaRecorder.stop()');
        mediaRecorder.stop();
        console.log('[GoogleMeets/StopRecorder] Called mediaRecorder.stop()');
        mediaRecorder.stream.getTracks().forEach((track) => {
          console.log('[GoogleMeets/StopRecorder] Stopping track:', track.kind);
          track.stop();
        });
      } else {
        console.log('[GoogleMeets/StopRecorder] MediaRecorder not recording');
      }
    },

    getMetadata: () => {
      const metadata = calendarMetadata || fallbackMetadata;
      return metadata ? { status: true, data: metadata } : { status: false, data: null };
    }
  };
};

const initializeStenographer = () => {
  if (window.has_injected_stenographer) {
    console.log('[Stenographer] Stenographer already initialized');
    return;
  }

  window.has_injected_stenographer = true;

  const userRepo = createRepo();
  const captionRepo = createRepo();
  const chatRepo = createRepo();
  const audioChunkRepo = createRepo();

  const googleMeets = GoogleMeets(
    userRepo,
    captionRepo,
    audioChunkRepo,
    chatRepo,
    WebRtcProxy(),
    FetchProxy(),
    RtcSenderProxy(),
    true
  );
  console.log(`[Stenographer] Stenographer initialized at: ${Date.now()}`);
  googleMeets.initialize();

  window.googleMeets = googleMeets;
};

initializeStenographer();

// Listen for messages from the web extension
window.addEventListener(
  'message',
  (event) => {
    if (event.source !== window) return; // Only accept messages from the same window
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
    if (event.source !== window) return; // Only accept messages from the same window
    if (event.data && event.data.type === 'STOP_RECORDING') {
      console.log('[Stenographer] Stop recording requested');
      window.googleMeets.stopRecorder();
    }
  },
  false
);
