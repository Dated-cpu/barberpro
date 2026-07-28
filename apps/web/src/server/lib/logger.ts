import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'ISO' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'barberpro' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.json(),
    }),
  ],
});

export function createContextLogger(context: string) {
  return logger.child({ context });
}

export default logger;
