import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'
import { terser } from 'rollup-plugin-terser'

let cfg
const dest = process.env.DEST
let output = process.env.OUTPUT
if (!dest) {
    console.log('No destination specified - code will be compiled but not uploaded')
} else if ((cfg = require('./screeps.json')[dest]) == null) {
    throw new Error('Invalid upload destination')
}

if (!output) {
    console.log('No output directory specified - code will be compiled but not saved')
    output = 'dist/main.js'
}

const shouldUglify = cfg && cfg.uglify
if (cfg) delete cfg.uglify

export default {
    input: 'src/main.ts',
    output: {
        file: output,
        format: 'cjs',
        sourcemap: false,
    },

    plugins: [
        clear({ targets: [output] }),
        resolve({ rootDir: 'src' }),
        commonjs(),
        shouldUglify && terser(),
        typescript({ tsconfig: './tsconfig.json' }),
        screeps({ config: cfg, dryRun: cfg == null }),
    ],
}
