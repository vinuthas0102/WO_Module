const isDevelopment = import.meta.env.DEV;
const isLoggingEnabled = import.meta.env.VITE_ENABLE_LOGGING !== 'false';

const shouldLog = isDevelopment && isLoggingEnabled;

export const logger = {
  log: (...args: any[]) => {
    if (shouldLog) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (shouldLog) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (shouldLog) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (shouldLog) {
      console.debug(...args);
    }
  },
};

export default logger;
