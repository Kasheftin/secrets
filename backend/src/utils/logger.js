import path from 'path'
import winston from 'winston'

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'error',
      filename: path.join('..', process.env.APP_LOGS, `backend.${process.env.NODE_ENV}.error.log`),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  exitOnError: false
})
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({
    level: 'debug',
    filename: path.join('..', process.env.APP_LOGS, `backend.${process.env.NODE_ENV}.debug.log`),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }))
  logger.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.simple(),
    colorize: true
  }))
}

logger.stream = {
  write (message) {
    logger.info(message)
  }
}

export default logger
