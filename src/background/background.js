import { LOG_LOCATIONS, logger } from '../logger/logger.js';
import { loadOffscreen } from './loadOffscreen.js';

const sendLog = (...log) => logger(LOG_LOCATIONS.Background, ...log);

let offscreenPort = null;
let contentPorts = new Map();
let isRecording = false;
let isPaused = false;

chrome.runtime.onMessage.addListener((message) => {
  if (Object.values(LOG_LOCATIONS).includes(message.type)) {
    console.log(`[${message.type}]`, ...message.log);
    return true;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'offscreen') {
    offscreenPort = port;
    offscreenPort.onDisconnect.addListener(() => {
      offscreenPort = null;
    });
    console.log('Offscreen port connected');
  } else if (port.name === 'content') {
    const tabId = port.sender.tab.id;
    contentPorts.set(tabId, port);
    port.onDisconnect.addListener(() => {
      contentPorts.delete(tabId);
    });
    console.log('Tab port connected');
  }

  port.onMessage.addListener(handleMessage);
});

// Handle one-time messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    const tabId = message.tabId ? message.tabId : sender.tab ? sender.tab.id : null;

    switch (message.type) {
      case 'start-recording':
        sendLog('Attempting to start recording');
        await loadOffscreen();
        if (offscreenPort) {
          offscreenPort.postMessage({ type: 'start-recording', tabId: tabId });
        } else {
          await chrome.runtime.sendMessage({ type: 'start-recording', target: 'offscreen-doc', tabId: tabId });
        }
        break;
      case 'toggle-recording':
        isPaused ? sendLog('Attempting to resume recording') : sendLog('Attempting to pause recording');
        const toggleType = isPaused ? 'resume-recording' : 'pause-recording';
        if (offscreenPort) {
          offscreenPort.postMessage({ type: toggleType });
        }
        if (contentPorts.has(tabId)) {
          contentPorts.get(tabId).postMessage({ type: toggleType });
        }
        sendResponse({ isRecording, isPaused });
        break;
      case 'stop-recording':
        sendLog('Attempting to stop recording');
        if (offscreenPort) {
          offscreenPort.postMessage({ type: 'stop-recording' });
        }
        if (contentPorts.has(tabId)) {
          contentPorts.get(tabId).postMessage({ type: 'stop-recording' });
        }
        break;
      case 'get-recording-status':
        sendLog('Get recording status requested:', isRecording, isPaused);
        sendResponse({ isRecording, isPaused });
        break;
      case 'screen-picked':
        console.log(tabId);
        if (contentPorts.has(tabId)) {
          contentPorts.get(tabId).postMessage({ type: 'start-recording' });
        }
        break;
      case 'recording-started':
        isRecording = true;
        break;
      case 'recording-paused':
        sendLog('Recording Pausesd');
        isPaused = true;
        break;
      case 'recording-resumed':
        sendLog('Recording Resumed');
        isPaused = false;
        break;
      case 'recording-complete':
        isRecording = false;
        chrome.offscreen.closeDocument();
        break;
    }
    return true;
  } catch (error) {
    sendLog(`Error in callRecorder with ${message.type} message:`, error);
    return false;
  }
}
