const INIT_LEVEL = 'INFO';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

class Logger {
  constructor(level = LOG_LEVELS.INFO) {
    this.level = level;
  }

  _log(level, message, ...args) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LOG_LEVEL_NAMES[level];
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;

      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(logMessage, ...args);
          break;
        case LOG_LEVELS.WARN:
          console.warn(logMessage, ...args);
          break;
        case LOG_LEVELS.INFO:
          console.info(logMessage, ...args);
        case LOG_LEVELS.DEBUG:
        default:
          console.log(logMessage, ...args);
          break;
      }
    }
  }

  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  setLevel(logLevel) {
    if (LOG_LEVELS[logLevel]) {
      this.level = LOG_LEVELS[logLevel];
    } else {
      this.warn(`Invalid log level: ${level}. Using default level: INFO`);
      this.level = LOG_LEVELS.INFO;
    }
  }
}

export const createLogger = (logLevel = INIT_LEVEL) => {
  return new Logger(LOG_LEVELS[logLevel]);
};

export { LOG_LEVELS };
