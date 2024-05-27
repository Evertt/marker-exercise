import jwt from 'jsonwebtoken'

type Options = {
  payload: Record<string, unknown>
  secret: string
  expirationTime: number
}

/**
 * Signs a given payload using `jsonwebtoken`.
 *
 * @async
 * @function
 * @param {Options} options - The options for signing the payload.
 * @param {Options["payload"]} options.payload - The payload to be signed.
 * @param {Options["secret"]} options.secret - The secret key used for signing.
 * @param {Options["expirationTime"]} options.expirationTime - The expiration time in seconds.
 * @returns {Promise<string>} Returns a promise that resolves to the signed JWT.
 * @throws {Error} Throws an error if there's an issue during signing.
 *
 * @example
 * const signedPayload = await signPayload({
 *   payload: { userId: 123 },
 *   secret: 'my-secret-key',
 *   expirationTime: 3600
 * });
 */
async function signPayload({ payload, secret, expirationTime }: Options) {
  return jwt.sign(payload, secret, { expiresIn: expirationTime })
}

export default signPayload
