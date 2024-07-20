import { LOG_LOCATIONS, logger } from '../logger/logger.js';

const sendLog = (...log) => logger(LOG_LOCATIONS.Background, ...log);

async function loadOffscreen() {
  try {
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find((c) => c.contextType === 'OFFSCREEN_DOCUMENT');

    if (!offscreenDocument) {
      sendLog('Creating offscreen document');
      await chrome.offscreen.createDocument({
        url: 'html/offscreen.html',
        reasons: ['CLIPBOARD'],
        justification: 'Write to clipboard'
      });
    } else {
      sendLog('Offscreen document already exists');
    }
    return true;
  } catch (error) {
    sendLog('Error creating offscreen document:', error);
    return false;
  }
}

export { loadOffscreen };
