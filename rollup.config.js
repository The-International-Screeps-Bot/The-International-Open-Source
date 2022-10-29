import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'
import { terser } from 'rollup-plugin-terser'

let cfg
const dest = process.env.DEST
if (!dest) {
    console.log('No destination specified - code will be compiled but not uploaded')
} else if ((cfg = require('./screeps.json')[dest]) == null) {
    throw new Error('Invalid upload destination')
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
        clear({ targets: ["dist"] }),
        commonjs(),
        resolve({ rootDir: 'src' }),
        shouldUglify && terser(),
        typescript({ tsconfig: './tsconfig.json' }),
        screeps({ config: cfg, dryRun: cfg == null }),
    ],
}
