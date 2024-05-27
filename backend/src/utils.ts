import winston from 'winston'
import type { ZodIssue } from 'zod'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'login-logs.log' })
  ]
})

export function errorsToString(errors: ZodIssue[]): string {
  return errors.map((error) => error.message).join('\n')
}
