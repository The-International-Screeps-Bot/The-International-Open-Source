import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'
import { terser } from 'rollup-plugin-terser'
import yaml from 'yaml'
import { readFileSync } from 'fs'

let cfg
const dest = process.env.DEST
if (!dest) {
    console.log('No destination specified - code will be compiled but not uploaded')
} else {
    cfg = (yaml.parse(readFileSync('.screeps.yaml', { encoding: 'utf8' })).servers || {})[dest]
    if (cfg == null) throw new Error('Invalid upload destination')
    cfg.hostname = cfg.host
    cfg.port = cfg.port || (cfg.secure ? 443 : 21025)
    cfg.host = `${cfg.host}:${cfg.port}`
    cfg.email = cfg.username
    cfg.protocol = cfg.secure ? 'https' : 'http'
    cfg.path = cfg.path || '/'
    cfg.branch = cfg.branch || 'auto'
}

const shouldUglify = cfg && cfg.uglify
if (cfg) delete cfg.uglify

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
        sourcemap: true,
    },

    plugins: [
        clear({ targets: ['dist'] }),
        commonjs(),
        resolve({ rootDir: 'src' }),
        shouldUglify && terser(),
        typescript({ tsconfig: './tsconfig.json' }),
        screeps({ config: cfg, dryRun: cfg == null }),
    ],
}
