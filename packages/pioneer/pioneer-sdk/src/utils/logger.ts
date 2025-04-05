/**
 * Pioneer SDK Logger Utility
 * Configurable logging system with support for different log levels
 */

export enum LogLevel {
  NONE = 0,     // No logging
  ERROR = 1,    // Only errors
  WARN = 2,     // Errors and warnings
  INFO = 3,     // Normal information (default)
  DEBUG = 4,    // Detailed information for debugging
  TRACE = 5     // Very verbose logging for tracing execution flow
}

class Logger {
  private static instance: Logger;
  private _level: LogLevel = LogLevel.INFO; // Default level
  private _prefix: string = "Pioneer SDK";

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the log level
   * @param level LogLevel enum value
   */
  public setLevel(level: LogLevel): void {
    this._level = level;
    this.info(`Log level set to: ${LogLevel[level]}`);
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this._level;
  }

  /**
   * Set a custom prefix for log messages
   * @param prefix Custom prefix
   */
  public setPrefix(prefix: string): void {
    this._prefix = prefix;
  }

  /**
   * Error level log
   * @param message The message to log
   * @param args Additional arguments
   */
  public error(message: string, ...args: any[]): void {
    if (this._level >= LogLevel.ERROR) {
      console.error(`${this.getTimestamp()} | ${this._prefix} | ERROR | ${message}`, ...args);
    }
  }

  /**
   * Warning level log
   * @param message The message to log
   * @param args Additional arguments
   */
  public warn(message: string, ...args: any[]): void {
    if (this._level >= LogLevel.WARN) {
      console.warn(`${this.getTimestamp()} | ${this._prefix} | WARN | ${message}`, ...args);
    }
  }

  /**
   * Info level log
   * @param message The message to log
   * @param args Additional arguments
   */
  public info(message: string, ...args: any[]): void {
    if (this._level >= LogLevel.INFO) {
      console.log(`${this.getTimestamp()} | ${this._prefix} | INFO | ${message}`, ...args);
    }
  }

  /**
   * Debug level log
   * @param message The message to log
   * @param args Additional arguments
   */
  public debug(message: string, ...args: any[]): void {
    if (this._level >= LogLevel.DEBUG) {
      console.log(`${this.getTimestamp()} | ${this._prefix} | DEBUG | ${message}`, ...args);
    }
  }

  /**
   * Trace level log - very verbose
   * @param message The message to log
   * @param args Additional arguments
   */
  public trace(message: string, ...args: any[]): void {
    if (this._level >= LogLevel.TRACE) {
      console.log(`${this.getTimestamp()} | ${this._prefix} | TRACE | ${message}`, ...args);
    }
  }

  /**
   * Get a formatted timestamp for logs
   * @returns Formatted timestamp string
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Export a function to set the log level from consumers
export const setLogLevel = (level: LogLevel): void => {
  logger.setLevel(level);
};

export default logger; 