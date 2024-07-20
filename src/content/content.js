const LOG_LOCATIONS = {
  Background: 'Background',
  Content: 'Content',
  Devtools: 'Devtools',
  Offscreen: 'Offscreen',
  Options: 'Options',
  Popup: 'Popup',
  Sidepanel: 'Sidepanel'
};

function logger(location, ...args) {
  if (!location || typeof location !== 'string') {
    console.error('Invalid location provided to logger');
    return;
  }

  if (location === LOG_LOCATIONS.Background) {
    console.log(`[${location}]`, ...args);
  } else if (Object.values(LOG_LOCATIONS).includes(location)) {
    console.log(...args);
    (async () => {
      try {
        chrome.runtime.sendMessage({
          type: location,
          log: args
        });
      } catch (error) {
        console.error('Error sending log message:', error);
      }
    })();
  } else {
    console.warn('Unknown log location:', location);
    console.log(location, ...args);
  }
}

const sendLog = (...log) => logger(LOG_LOCATIONS.Content, ...log);

const INJECT = 'lib/inject.js';
let isPaused = false;
let isRecording = false;

function injectScript(file) {
  var script = document.createElement('script');
  script.setAttribute('src', chrome.runtime.getURL(file));
  (document.head || document.documentElement).appendChild(script);
}
injectScript(INJECT);

function checkStenographerInjected() {
  const proxyCheckMeta = document.getElementById('dg-proxy-check');
  return proxyCheckMeta && proxyCheckMeta.getAttribute('content') === 'true';
}

const port = chrome.runtime.connect({ name: 'content' });

port.onMessage.addListener(async (message) => {
  try {
    if (!checkStenographerInjected()) {
      sendLog('Error: No Stenographer');
      return;
    }

    switch (message.type) {
      case 'start-recording':
        await startRecording();
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
    sendLog(`Error in with ${message.type} message:`, error);
  }
});

async function startRecording() {
  if (isRecording) {
    sendLog('Error: Recording already in Progress');
    return false;
  }

  try {
    window.postMessage({ type: 'START_RECORDING' }, '*');
    port.postMessage({ type: 'recording-started' });
    sendLog('Recording Started');
    isRecording = true;
    return true;
  } catch (error) {
    sendLog('Error: Starting Recording', error);
    isRecording = false;
    return false;
  }
}

async function toggleRecording() {
  try {
    if (!isPaused) {
      window.postMessage({ type: 'PAUSE_RECORDING' }, '*');
      port.postMessage({ type: 'recording-paused' });
      sendLog('Recording Paused');
    } else if (isPaused) {
      window.postMessage({ type: 'RESUME_RECORDING' }, '*');
      port.postMessage({ type: 'recording-resumed' });
      sendLog('Recording Resumed');
    } else {
      sendLog('Error: No Recording to pause/resume');
      return false;
    }
    isPaused = !isPaused;
    return true;
  } catch (error) {
    sendLog('Error: Pausing Recording', error);
    return false;
  }
}

async function stopRecording() {
  try {
    if (isRecording) {
      window.postMessage({ type: 'STOP_RECORDING' }, '*');
      port.postMessage({ type: 'recording-stopped' });
      sendLog('Recording Stopped');

      isPaused = false;
      isRecording = false;

      return true;
    } else {
      sendLog('Error: No Recording to stop');
      return false;
    }
  } catch (error) {
    sendLog('Error: Stopping Recording', error);
    return false;
  }
}

window.addEventListener('beforeunload', async () => {
  if (isRecording) {
    await stopRecording();
    sendLog('Recording Stopped due to page unload');
  }
});
