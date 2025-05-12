import fs from "fs";
import path from "path";

class Logger {
  constructor(logPath) {
    this.logPath = logPath;
    this.stream = logPath
      ? fs.createWriteStream(logPath, { flags: "a" })
      : null;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}\n`;
  }

  _write(level, message) {
    const formattedMessage = this._formatMessage(level, message);

    // Always write to console
    console[level.toLowerCase()](formattedMessage.trim());

    // Write to file if stream exists
    if (this.stream) {
      this.stream.write(formattedMessage);
    }
  }

  info(message) {
    this._write("INFO", message);
  }

  warn(message) {
    this._write("WARN", message);
  }

  error(message) {
    this._write("ERROR", message);
  }

  close() {
    if (this.stream) {
      this.stream.end();
    }
  }
}

export function setupLogger(logPath) {
  if (logPath) {
    // Ensure log directory exists
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  return new Logger(logPath);
}
