import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  console.error('[LOGGER] Failed to create logs directory:', err);
}

let logger: winston.Logger;
try {
  const transports: winston.transport[] = [];
  
  try {
    if (fs.existsSync(logsDir) && fs.statSync(logsDir).isDirectory()) {
      const testFile = path.join(logsDir, '.test-write');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        transports.push(
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
            handleExceptions: true,
            handleRejections: true
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
          })
        );
      } catch (writeErr) {
        console.warn('[LOGGER] Logs directory not writable, using console only');
      }
    }
  } catch (dirErr) {
    console.warn('[LOGGER] Could not check logs directory, using console only');
  }
  
  transports.push(new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
          })
        )
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  }));
  
  const loggerConfig: winston.LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'fundi-backend' },
    transports
  };
  logger = winston.createLogger(loggerConfig);
} catch (err) {
  console.error('[LOGGER] Failed to create logger:', err);
  logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console()]
  });
}

export default logger;
export { logger };

