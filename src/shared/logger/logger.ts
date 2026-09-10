interface LogContext {
  status?: number;
  code?: string;
  count?: number;
  durationMs?: number;
}

type LogLevel = 'info' | 'warn' | 'error';

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  if (level === 'info' && import.meta.env?.PROD) return;
  // 외부 객체가 전달되어도 요청 원문·세션·Error 객체를 출력하지 않는다.
  const safeContext: LogContext = {};
  if (typeof context.status === 'number') safeContext.status = context.status;
  if (typeof context.code === 'string') safeContext.code = context.code;
  if (typeof context.count === 'number') safeContext.count = context.count;
  if (typeof context.durationMs === 'number')
    safeContext.durationMs = context.durationMs;
  console[level](
    `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`,
    safeContext,
  );
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog('warn', message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog('error', message, context);
  },
};
