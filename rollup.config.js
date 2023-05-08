import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps-ss3'

const dest = process.env.DEST
if (!dest) {
    console.log('No destination specified - code will be compiled but not uploaded')
}

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
        typescript({ tsconfig: './tsconfig.json' }),
        screeps({ server: dest, branch: 'default', dryRun: !dest }),
    ],
}
