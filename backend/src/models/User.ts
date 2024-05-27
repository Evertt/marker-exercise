import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Schema } from 'mongoose'
import signPayload from '../services/signPayload'

const { SESSION_EXPIRY = '0' } = process.env ?? {}
const expires = +SESSION_EXPIRY || 1000 * 60 * 15

const Session = new Schema({
  refreshToken: {
    type: String,
    default: ''
  }
})

const userSchema = new Schema(
  {
    name: {
      type: String
    },
    email: {
      type: String,
      required: [true, "can't be blank"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 128
    },
    provider: {
      type: String,
      required: true,
      default: 'local'
    },
    role: {
      type: String,
      default: 'USER'
    },
    refreshToken: {
      type: [Session]
    }
  },
  {
    timestamps: true,
    methods: {
      toJSON: function () {
        return {
          id: this._id,
          provider: this.provider,
          email: this.email,
          name: this.name,
          role: this.role,
          // @ts-ignore yes it does exist
          createdAt: this.createdAt,
          // @ts-ignore yes it does exist
          updatedAt: this.updatedAt
        }
      },

      generateToken: function () {
        const { JWT_SECRET } = process.env

        if (!JWT_SECRET) {
          throw new Error('Please define the JWT_SECRET environment variable')
        }

        return signPayload({
          payload: {
            id: this._id,
            provider: this.provider,
            email: this.email
          },
          secret: JWT_SECRET,
          expirationTime: expires / 1000
        })
      },

      comparePassword: function (
        candidatePassword: string,
        callback: (err: Error | null, isMatch?: boolean) => void
      ) {
        bcrypt.compare(candidatePassword, this.password || '', (err, isMatch) => {
          if (err) {
            return callback(err)
          }
          callback(null, isMatch)
        })
      }
    }
  }
)

export const hashPassword = async (password: string) => {
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, function (err, hash) {
      if (err) {
        reject(err)
      } else {
        resolve(hash)
      }
    })
  })

  return hashedPassword
}

const User = mongoose.model('User', userSchema)

export default User
