import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'
import { terser } from "rollup-plugin-terser";
import configs from './screeps.json'

let cfg
const dest = process.env.DEST
if (!dest) {
     console.log('No destination specified - code will be compiled but not uploaded')
} else if ((cfg = configs[dest]) == null) {
     throw new Error('Invalid upload destination')
}
if (cfg) {
console.log(cfg.uglify)
}

export default {
     input: 'src/main.ts',
     output: {
          file: 'dist/main.js',
          format: 'cjs',
          sourcemap: false,
     },

     plugins: [
          clear({ targets: ['dist'] }),
          resolve({ rootDir: 'src' }),
          commonjs(),
          (cfg && cfg.uglify && terser()),
          typescript({ tsconfig: './tsconfig.json' }),
          screeps({ config: cfg, dryRun: cfg == null  }),
     ],
}
