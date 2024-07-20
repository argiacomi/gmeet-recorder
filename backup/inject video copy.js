import { createLogger } from './lib/logger';
import { RtcSenderProxy, WebRtcProxy } from './lib/proxies/index';
import { createRepo } from './lib/repo';

const START_CHUNK_ID = 1e3;

const EVENTS = {
  START_RECORDING: 'START_RECORDING',
  STOP_RECORDING: 'STOP_RECORDING',
  MEETING_ENDED: 'MEETING_ENDED'
};

const RECORDER_MODES = {
  WEBRTC: 'webrtc',
  HTML: 'html'
};

const logger = createLogger();

const GoogleMeets = (audioChunks, videoChunks, webRtcProxy, rtcSenderProxy, config = {}) => {
  let audioDestination, audioContext, audioRecorder;
  let videoDestination, videoContext, videoRecorder;
  let audioChunkId = START_CHUNK_ID;
  let videoChunkId = START_CHUNK_ID;
  let isRecording = false;

  const audioStreams = [];
  const videoStreams = [];
  const localStreams = [];

  logger.setLevel(config.logLevel);

  const addStreamToDestination = (stream) => {
    if (!audioContext) {
      logger.error('[AddStream] No audio context');
      return;
    }

    if (!isRecording) {
      logger.debug('[AddStream] Recording has not started yet');
      return;
    }

    logger.debug('[AddStream] Adding stream::', stream);

    if (stream.getAudioTracks().length !== 0) {
      logger.debug(`[AddStream]  Adding audio tracks stream::`, stream);
      if (!audioDestination) {
        logger.debug('[AddStream] No audio destination');
        return;
      }
      audioContext.createMediaStreamSource(stream).connect(audioDestination);
    } else if (stream.getVideoTracks().length !== 0) {
      logger.debug(`[AddStream]  Adding video tracks stream::`, stream);

      if (!videoDestination) {
        logger.debug('[AddStream] No video destination');
        return;
      }
      videoContext.createMediaStreamSource(stream).connect(videoDestination);
    } else {
      logger.debug(`[AddStream] Stream ${stream.id} has no audio or video tracks`);
      return;
    }
  };

  const handleTrackEvent = (peerConnection, event) => {
    if (event.streams.length === 0 || peerConnection.connectionState === 'closed') return;
    logger.debug('[HandleTrack] Peer connection', peerConnection);
    logger.debug('[HandleTrack] Track event', event);

    for (const stream of event.streams) {
      if (stream.getAudioTracks().length > 0) {
        audioStreams.push(stream);
        addStreamToDestination(stream);
      }
      if (stream.getVideoTracks().length > 0) {
        videoStreams.push(stream);
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
  const handleVideoData = (event) => {
    videoChunks.set(videoChunkId++, event.data);
  };

  const startWebRTCRecorder = (timeslice) => {
    try {
      if (!audioContext || !videoContext) {
        logger.error('[StartWebRTC] WebRTC has no audio / video context');
        return false;
      }

      audioDestination = audioContext.createMediaStreamDestination();
      logger.debug('[StartWebRTC] Audio destination created', audioDestination);

      videoDestination = videoContext.createMediaStreamDestination();
      logger.debug('[StartWebRTC] Video destination created', videoDestination);

      audioStreams.forEach(addStreamToDestination);
      videoStreams.forEach(addStreamToDestination);
      startRecording(timeslice);
      return true;
    } catch (error) {
      logger.error('[StartWebRTC] Failed to start recorder', error);
      return false;
    }
  };

  const startHTMLRecorder = (timeslice) => {
    const audioElements = document.getElementsByTagName('audio');

    if (audioElements.length === 0) {
      logger.error('[StartHTMLRecorder] No audio elements found on page');
    }

    if (!audioContext) {
      logger.error('[StartHTMLRecorder] No audio context');
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

  const startRecording = async (timeslice) => {
    if (!audioContext || !videoContext) {
      logger.error('[StarRecording] No audio/video context');
      return;
    }

    try {
      if (audioContext.state !== 'running' || videoContext.state !== 'running') {
        logger.warn('[StartRecording] Audio/Video context is not running. Attempting to resume.');
        await audioContext.resume();
        await videoContext.resume();
      }

      audioRecorder = new MediaRecorder(audioDestination.stream, {
        mimeType: 'audio/webm'
      });
      videoRecorder = new MediaRecorder(videoDestination.stream, {
        mimeType: 'video/webm'
      });

      audioRecorder.ondataavailable = handleAudioData;
      audioRecorder.onstop = saveRecording('audio');
      videoRecorder.ondataavailable = handleVideoData;
      videoRecorder.onstop = saveRecording('video');

      if (audioChunkId !== START_CHUNK_ID) {
        logger.error(`[StartRecording] Incorrect audio ID. Got: ${audioChunkId}, Expected: ${START_CHUNK_ID}`);
        audioChunks.set(audioChunkId++, config.header);
      }
      if (videoChunkId !== START_CHUNK_ID) {
        logger.error(`[StartRecording] Incorrect video ID. Got: ${videoChunkId}, Expected: ${START_CHUNK_ID}`);
        videoChunks.set(videoChunkId++, config.header);
      }

      audioRecorder.start(timeslice);
      videoRecorder.start(timeslice);
      logger.debug('[StartRecording] Recorder started');
    } catch (error) {
      logger.error('[StartRecording] Failed to start recording', error);
      throw error;
    }
  };

  const saveRecording = (type) => {
    logger.debug(`[SaveRecording] ${type} recorder stopping`);
    const blob = new Blob(audioChunks.toArray(), { type: `${type}/webm` });
    const url = URL.createObjectURL(blob);
    const filename = `${type}_recording_${new Date().toISOString()}.webm`;
    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(downloadLink);
    logger.debug(`[SaveRecording] ${type} recording saved`, filename);
  };

  const handleMessage = (event) => {
    if (event.source !== window) return;

    switch (event.data?.type) {
      case EVENTS.START_RECORDING:
        logger.info('[GoogleMeets] Start recording requested');
        window.googleMeets.startRecorder(2000, RECORDER_MODES.WEBRTC);
        break;
      case EVENTS.STOP_RECORDING:
        logger.info('[GoogleMeets] Stop recording requested');
        window.googleMeets.stopRecorder();
        break;
      case EVENTS.MEETING_ENDED:
        logger.info('[GoogleMeets] Meeting ended');
        window.googleMeets.cleanup();
        break;
    }
  };

  const cleanup = () => {
    logger.debug('[GoogleMeets] Performing cleanup operations');

    window.googleMeets.stopRecorder();

    audioStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });

    localStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });

    if (audioContext) {
      audioContext
        .close()
        .then(() => {
          logger.info('[GoogleMeets] Audio context closed');
        })
        .catch((error) => {
          logger.error('[GoogleMeets] Error closing audio context', error);
        });
    }

    if (videoContext) {
      videoContext
        .close()
        .then(() => {
          logger.info('[GoogleMeets] Video context closed');
        })
        .catch((error) => {
          logger.error('[GoogleMeets] Error closing video context', error);
        });
    }

    // Clear arrays
    audioStreams.length = 0;
    videoStreams.length = 0;
    localStreams.length = 0;

    // Remove event listeners
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('message', handleMessage);

    logger.info('[Cleanup] Cleanup completed');
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
          logger.debug('[GoogleMeets] Audio::Window load event');
          audioContext = new AudioContext();
          window.dg_audio_context = audioContext;
          logger.debug('[GoogleMeets] Video::Window load event');
          videoContext = new VideoContext();
          window.dg_audio_context = audioContext;
        });

        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('message', handleMessage);
      } catch (error) {
        logger.error('[GoogleMeets] Initialization failed', error);
      }
    },

    startRecorder: (timeslice, mode = 'webrtc') => {
      logger.debug(`[StartRecorder] Starting recorder in ${mode} mode`);
      switch (mode) {
        case 'webrtc':
          isRecording = true;
          return startWebRTCRecorder(timeslice);
        case 'html':
          isRecording = true;
          return startHTMLRecorder(timeslice);
        default:
          logger.error(`[StartRecorder] Unsupported recorder mode: ${mode}`);
          return false;
      }
    },

    stopRecorder: () => {
      if (audioRecorder && audioRecorder.state === 'recording') {
        logger.debug('[StopRecorder] Stopping Media Recorder');
        audioRecorder.stop();
        audioRecorder.stream.getTracks().forEach((track) => {
          logger.debug('[StopRecorder] Stopping track:', track.kind);
          track.stop();
        });
        isRecording = false;
      } else {
        logger.debug('[StopRecorder] MediaRecorder not recording');
      }
    }
  };
};

const initializeStenographer = () => {
  if (window.has_injected_stenographer) {
    logger.debug('[Stenographer] Stenographer already initialized');
    return;
  }

  window.has_injected_stenographer = true;

  const audioChunkRepo = createRepo();
  const videoChunkRepo = createRepo();

  const googleMeets = GoogleMeets(audioChunkRepo, videoChunkRepo, WebRtcProxy(), RtcSenderProxy(), {
    logLevel: 'DEBUG'
  });
  logger.debug(`[Stenographer] Stenographer initialized at: ${Date.now()}`);
  googleMeets.initialize();
  window.googleMeets = googleMeets;
};

logger.debug('[Stenographer] Injecting Stenographer');
initializeStenographer();
