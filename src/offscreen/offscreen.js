import { LOG_LOCATIONS, logger } from '../logger/logger.js';

const sendLog = (...log) => logger(LOG_LOCATIONS.Offscreen, ...log);
sendLog('Offscreen script loaded');

let recorder;
let data = [];
let isRecording = false;

const port = chrome.runtime.connect({ name: 'offscreen' });

port.onMessage.addListener(async (message) => {
  try {
    switch (message.type) {
      case 'start-recording':
        await startRecording(message.tabId);
        break;
      case 'pause-recording':
      case 'resume-recording':
        await toggleRecording();
        break;
      case 'stop-recording':
        await stopRecording();
        break;
    }
  } catch (error) {
    sendLog('Error handling message:', error);
  }
});

async function startRecording(tabId) {
  if (isRecording) {
    sendLog('Error: Recording already in Progress');
    return false;
  }

  data = [];

  try {
    const media = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true });
    sendLog('Sending back message:', tabId);
    port.postMessage({ type: 'screen-picked', tabId: tabId });
    recorder = new MediaRecorder(media, { mimeType: 'video/webm' });
    recorder.ondataavailable = (event) => {
      data.push(event.data);
    };
    recorder.stop = saveRecording;
    recorder.start(100);
    isRecording = true;
    sendLog('Recording Started');
    port.postMessage({ type: 'recording-started' });
    return true;
  } catch (error) {
    isRecording = false;
    recorder = null;
    sendLog('Error starting recording:', error);
    return false;
  }
}

function toggleRecording() {
  if (recorder && recorder.state === 'recording') {
    recorder.pause();
    port.postMessage({ type: 'recording-paused' });
    sendLog('Recording Paused');
  } else if (recorder && recorder.state === 'paused') {
    recorder.resume();
    port.postMessage({ type: 'recording-resumed' });
    sendLog('Recording Resumed');
  } else {
    sendLog('Error: No Recording');
  }
}

function stopRecording() {
  if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => {
      track.stop();
    });
    recorder = null;
    isRecording = false;
    sendLog('Recording Stopped');
    port.postMessage({ type: 'recording-stopped' });
  } else {
    sendLog('Error: No Recording');
  }
}

function saveRecording() {
  try {
    sendLog('Saving video recording');
    const blob = new Blob(data, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const filename = `video_recording_${new Date().toISOString()}.webm`;

    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    downloadLink.href = url;
    downloadLink.download = filename;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(downloadLink);
    data = [];

    sendLog(`Video recording saved`, filename);
    port.postMessage({ type: 'recording-complete', filename });

    return true;
  } catch (error) {
    sendLog('Error saving recording:', error);
    return false;
  }
}

window.addEventListener('beforeunload', async () => {
  if (isRecording) {
    stopRecording();
    sendLog('Recording stopped due to page unload');
  }
});
