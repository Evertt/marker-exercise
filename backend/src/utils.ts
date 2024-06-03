import winston from 'winston'
import type { ZodIssue } from 'zod'
import type { Model } from 'mongoose'

export type GetModelGenerics<M extends Model<any>> =
  M extends Model<infer RawDocType, any, any, any, infer HydratedDocument>
    ? {
        RawDocType: RawDocType
        HydratedDocument: HydratedDocument
      }
    : never

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
