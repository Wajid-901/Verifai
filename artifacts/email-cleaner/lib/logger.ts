type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    return JSON.stringify({ error: "Failed to stringify log metadata" });
  }
}

function log(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };
  
  const output = safeStringify(entry);
  
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info:  (msg: string, meta?: LogMeta) => log("info",  msg, meta),
  warn:  (msg: string, meta?: LogMeta) => log("warn",  msg, meta),
  error: (msg: string, meta?: LogMeta) => log("error", msg, meta),
};
