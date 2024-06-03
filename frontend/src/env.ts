import type { OmitIndexSignature, Simplify } from 'type-fest'

const meta = import.meta
type Env = Readonly<Simplify<OmitIndexSignature<typeof meta.env>>>

const env = import.meta.env as Env

export default env
