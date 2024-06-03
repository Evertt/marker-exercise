import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'
import { stripIndent } from 'common-tags'

const prefixes = {
  public: 'VITE_',
  private: ''
}

/** @param {string} dir */
function mkdirp(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (/** @type {any} */ e) {
    if (e.code === 'EEXIST') {
      if (!fs.statSync(dir).isDirectory()) {
        throw new Error(`Cannot create directory ${dir}, a file already exists at this position`)
      }
      return
    }
    throw e
  }
}

/**
 * @param {string} file
 * @param {string} code
 */
function write(file, code) {
  mkdirp(path.dirname(file))
  fs.writeFileSync(file, code)
}

const valid_identifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/**
 * @typedef {{ [k: string]: string }} Env
 */

/**
 * @param {'public' | 'private'} id
 * @param {Env} env
 * @returns {string}
 */
function create_static_types(id, env) {
  const declarations = Object.keys(env)
    .filter((k) => valid_identifier.test(k))
    .filter((k) => k.startsWith(prefixes[id]))
    .map((k) => `${k}: ${isNaN(+env[k]) ? 'string' : '`${number}`'}`)

  return stripIndent`
		interface ImportMetaEnv {
			${declarations.join('\n\t\t\t')}
		}
	`
}

/**
 * @param {Env} env
 */
const template = (env) =>
  `
${'' && create_static_types('private', env)}

${create_static_types('public', env)}
`.trim()

async function write_ambient() {
  // eslint-disable-next-line no-undef
  const env = loadEnv('development', process.cwd(), prefixes.public)
  write(path.join('node_modules/.vue-env-ts', 'ambient.d.ts'), template(env))
}

write_ambient()
