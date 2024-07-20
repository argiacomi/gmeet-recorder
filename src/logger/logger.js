export const LOG_LOCATIONS = {
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

export { logger };
