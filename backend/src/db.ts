import { config } from 'dotenv'
import mongoose, { STATES } from 'mongoose'

config()

type Mongoose = InstanceType<typeof mongoose.Mongoose>

type Cached = {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

declare const global: typeof globalThis & {
  mongoose: Cached
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDb() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    throw new Error('Please define the DATABASE_URL environment variable')
  }

  const connected = STATES.connected

  if (cached.conn && cached.conn?.connection.readyState === connected) {
    return cached.conn
  }

  const disconnected = cached.conn && cached.conn?.connection.readyState !== connected
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false
      // bufferMaxEntries: 0,
      // useFindAndModify: true,
      // useCreateIndex: true
    }

    mongoose.set('strictQuery', true)
    cached.promise = mongoose.connect(DATABASE_URL, opts).then((mongoose) => {
      return mongoose
    })
  }
  cached.conn = await cached.promise

  return cached.conn
}

export default connectDb
