let recorder;
let data = [];
let isPaused = false;
let isRecording = false;

sendLog('Offscreen script loaded');

function sendLog(...args) {
  console.log(...args);
  chrome.runtime.sendMessage({
    type: 'offscreen-log',
    log: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')
  });
}

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
  try {
    sendLog('Offscreen received message:', message);
    if (message.target !== 'offscreen-doc') {
      return;
    }

    switch (message.type) {
      case 'start-recording':
        startRecording();
        break;
      case 'pause-recording':
      case 'resume-recording':
        pauseRecording();
        break;
      case 'stop-recording':
        stopRecording();
        break;
      case 'save-recording':
        sendLog('Save recording message received');
        saveRecording();
        break;
      default:
        sendLog(`Unexpected message type received: '${message.type}'.`);
    }
  } catch (error) {
    sendLog('Error handling message:', error);
  }
}

async function startRecording() {
  if (isRecording) {
    sendLog('recording-in-progress');
    return;
  }
  sendLog('Starting Recording...');

  data = [];
  isPaused = false;
  isRecording = true;

  try {
    const media = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true });
    chrome.runtime.sendMessage({ type: 'screen-picked' });
    recorder = new MediaRecorder(media, { mimeType: 'video/webm' });
    recorder.ondataavailable = (event) => {
      data.push(event.data);
    };
    recorder.stop = saveRecording;
    recorder.start(1e2);
    sendLog('recording-started');
  } catch (error) {
    sendLog('Error starting recording:', error);
    isRecording = false;
    recorder = null;
  }
}

function pauseRecording() {
  if (recorder && recorder.state === 'recording') {
    recorder.pause();
    sendLog('recording-paused');
    isPaused = true;
    return;
  } else if (recorder && recorder.state === 'paused') {
    recorder.resume();
    sendLog('recording-resumed');
    isPaused = false;
    return;
  } else {
    sendLog('no-recording');
  }
}

async function stopRecording() {
  if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
    sendLog('recording-stopping');
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => {
      track.stop();
    });
    recorder = null;
    isPaused = false;
    isRecording = false;
  } else {
    sendLog('no-recording');
  }
}

function saveRecording() {
  try {
    sendLog('[SaveRecording] Saving video recording');
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

    sendLog(`[SaveRecording] Video recording saved`, filename);
    data = [];
    sendLog('recording-complete');
  } catch (error) {
    sendLog('[Background] Error saving recording:', error);
  }
}

window.addEventListener('beforeunload', () => {
  if (isRecording) {
    stopRecording();
  }
});
