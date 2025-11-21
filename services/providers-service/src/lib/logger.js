// services/providers-service/src/lib/logger.js
export const logger = {
  level: process.env.LOG_LEVEL || 'info',
  // pretty logging în dev
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:standard',
          colorize: true,
          singleLine: false
        }
      },
  // poți adăuga:
  // base: { service: 'providers-service' }
};
