/**
 * Logging utility for AI Babysitter Frontend
 * Provides structured logging with different levels and categories
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  API = 'API',
  SESSION = 'SESSION',
  PARENT = 'PARENT',
  VOICE = 'VOICE',
  CAMERA = 'CAMERA',
  UI = 'UI',
  WEBSOCKET = 'WEBSOCKET',
  SAFETY = 'SAFETY',
  GENERAL = 'GENERAL',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  error?: Error;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  enabledCategories: Set<LogCategory> | null; // null = all categories
  logInProduction: boolean;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;
  private config: LoggerConfig;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.config = this.loadConfig();

    // Log configuration on initialization (only if enabled)
    if (this.config.enabled) {
      console.log('%c[LOGGER] Logging system initialized', 'color: #9C27B0; font-weight: bold', {
        enabled: this.config.enabled,
        minLevel: this.config.minLevel,
        categories: this.config.enabledCategories ? Array.from(this.config.enabledCategories) : 'ALL',
        environment: process.env.NODE_ENV,
        logInProduction: this.config.logInProduction,
      });
    }
  }

  private loadConfig(): LoggerConfig {
    // Check if logging is enabled
    const enabled = process.env.REACT_APP_LOGGING_ENABLED !== 'false';

    // Get minimum log level
    const minLevelStr = process.env.REACT_APP_LOG_LEVEL?.toUpperCase() || 'DEBUG';
    const minLevel = (LogLevel as any)[minLevelStr] || LogLevel.DEBUG;

    // Get enabled categories
    const categoriesStr = process.env.REACT_APP_LOG_CATEGORIES?.trim();
    let enabledCategories: Set<LogCategory> | null = null;

    if (categoriesStr) {
      const categories = categoriesStr.split(',').map(c => c.trim().toUpperCase());
      enabledCategories = new Set(
        categories
          .filter(c => c in LogCategory)
          .map(c => (LogCategory as any)[c])
      );
    }

    // Check if production logging is enabled
    const logInProduction = process.env.REACT_APP_LOG_IN_PRODUCTION === 'true';

    return {
      enabled,
      minLevel,
      enabledCategories,
      logInProduction,
    };
  }

  // Allow runtime configuration updates
  public setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    console.log(`%c[LOGGER] Logging ${enabled ? 'enabled' : 'disabled'}`, 'color: #9C27B0; font-weight: bold');
  }

  public setMinLevel(level: LogLevel) {
    this.config.minLevel = level;
    console.log(`%c[LOGGER] Min log level set to ${level}`, 'color: #9C27B0; font-weight: bold');
  }

  public setCategories(categories: LogCategory[] | null) {
    this.config.enabledCategories = categories ? new Set(categories) : null;
    console.log(`%c[LOGGER] Enabled categories:`, 'color: #9C27B0; font-weight: bold',
      categories ? Array.from(categories) : 'ALL');
  }

  public getConfig(): LoggerConfig {
    return {
      ...this.config,
      enabledCategories: this.config.enabledCategories ? new Set(this.config.enabledCategories) : null
    };
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
    };
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    return `[${timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`;
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    // If logging is disabled, don't log anything
    if (!this.config.enabled) {
      return false;
    }

    // Check if category is enabled
    if (this.config.enabledCategories && !this.config.enabledCategories.has(category)) {
      return false;
    }

    // Check log level priority
    const levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    const entryPriority = levelPriority[level];
    const minPriority = levelPriority[this.config.minLevel];

    if (entryPriority < minPriority) {
      return false;
    }

    // In production, respect logInProduction setting
    if (!this.isDevelopment && !this.config.logInProduction) {
      // In production without logInProduction, only log WARN and ERROR
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }

    return true;
  }

  private log(entry: LogEntry) {
    // Always add to history (even if not logged to console)
    this.addToHistory(entry);

    // Check if we should log this entry
    if (!this.shouldLog(entry.level, entry.category)) {
      return;
    }

    const formattedMessage = this.formatMessage(entry);
    const style = this.getLogStyle(entry.level);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.log(`%c${formattedMessage}`, style, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data || '', entry.error || '');
        break;
    }
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: #888',
      [LogLevel.INFO]: 'color: #2196F3',
      [LogLevel.WARN]: 'color: #FF9800',
      [LogLevel.ERROR]: 'color: #F44336; font-weight: bold',
    };
    return styles[level];
  }

  // Public logging methods
  debug(category: LogCategory, message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data);
    this.log(entry);
  }

  info(category: LogCategory, message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, data);
    this.log(entry);
  }

  warn(category: LogCategory, message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, data);
    this.log(entry);
  }

  error(category: LogCategory, message: string, error?: Error, data?: any) {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, data, error);
    this.log(entry);
  }

  // Category-specific convenience methods
  api = {
    request: (endpoint: string, method: string, data?: any) => {
      this.info(LogCategory.API, `${method} ${endpoint}`, data);
    },
    response: (endpoint: string, status: number, data?: any) => {
      this.debug(LogCategory.API, `Response ${status} from ${endpoint}`, data);
    },
    error: (endpoint: string, error: Error, data?: any) => {
      this.error(LogCategory.API, `API Error: ${endpoint}`, error, data);
    },
  };

  session = {
    start: (sessionId: string, childName: string, childAge: number) => {
      this.info(LogCategory.SESSION, `Session started: ${childName} (${childAge}yo)`, { sessionId });
    },
    end: (sessionId: string) => {
      this.info(LogCategory.SESSION, `Session ended`, { sessionId });
    },
    error: (message: string, error?: Error) => {
      this.error(LogCategory.SESSION, message, error);
    },
  };

  voice = {
    startListening: () => {
      this.info(LogCategory.VOICE, 'Started voice recognition');
    },
    stopListening: () => {
      this.info(LogCategory.VOICE, 'Stopped voice recognition');
    },
    transcript: (text: string, isFinal: boolean) => {
      this.debug(LogCategory.VOICE, `Transcript (${isFinal ? 'final' : 'interim'}): ${text}`);
    },
    speak: (text: string) => {
      this.info(LogCategory.VOICE, `Speaking: ${text.substring(0, 50)}...`);
    },
    error: (message: string, error?: Error) => {
      this.error(LogCategory.VOICE, message, error);
    },
  };

  camera = {
    start: () => {
      this.info(LogCategory.CAMERA, 'Camera started');
    },
    stop: () => {
      this.info(LogCategory.CAMERA, 'Camera stopped');
    },
    capture: (imageSize?: number) => {
      this.info(LogCategory.CAMERA, 'Photo captured', { imageSize });
    },
    error: (message: string, error?: Error) => {
      this.error(LogCategory.CAMERA, message, error);
    },
  };

  ui = {
    navigation: (from: string, to: string) => {
      this.info(LogCategory.UI, `Navigation: ${from} → ${to}`);
    },
    action: (component: string, action: string, data?: any) => {
      this.debug(LogCategory.UI, `${component}: ${action}`, data);
    },
    error: (component: string, message: string, error?: Error) => {
      this.error(LogCategory.UI, `${component}: ${message}`, error);
    },
  };

  safety = {
    alert: (level: string, message: string, data?: any) => {
      this.warn(LogCategory.SAFETY, `Safety Alert (${level}): ${message}`, data);
    },
    panic: (sessionId: string) => {
      this.error(LogCategory.SAFETY, 'PANIC BUTTON PRESSED', undefined, { sessionId });
    },
  };

  // Get log history (useful for debugging)
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  // Clear log history
  clearHistory() {
    this.logHistory = [];
    this.info(LogCategory.GENERAL, 'Log history cleared');
  }

  // Export logs as JSON (useful for support)
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();
