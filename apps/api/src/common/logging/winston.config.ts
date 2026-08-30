import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';

const correlationIdFormat = winston.format((info) => {
  try {
    const cls = ClsServiceManager.getClsService();
    if (cls.isActive()) {
      info.correlationId = cls.getId();
    }
  } catch {
    // Không có CLS context đang hoạt động (bootstrap log, BullMQ processor) — bỏ qua.
  }
  return info;
});

const devFormat = winston.format.printf(
  ({ timestamp, level, context, correlationId, message, stack }) => {
    const ctx = context ? `[${context}] ` : '';
    const cid = correlationId ? `[${correlationId}] ` : '';
    const trace = stack ? `\n${stack}` : '';
    return `${timestamp} ${level} ${cid}${ctx}${message}${trace}`;
  },
);

export const winstonConfig: winston.LoggerOptions = {
  level: 'debug',
  format: winston.format.combine(
    correlationIdFormat(),
    winston.format.timestamp(),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), devFormat),
  ),
  transports: [new winston.transports.Console()],
};
