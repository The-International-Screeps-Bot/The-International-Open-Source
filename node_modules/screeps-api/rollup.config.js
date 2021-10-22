import typescript from 'rollup-plugin-typescript2'

export default {
  input: {
    ScreepsAPI: 'src/index.js'
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    exports: 'named',
    preferConst: true,
    globals: {
      ws: 'WebSocket'
    },
  },
  // external(id){
  //   return !!require('./package.json').dependencies[id];
  // },
  external: ['ws', 'fs', 'axios', 'bluebird', 'yamljs', 'url', 'events', 'zlib', 'path','debug', 'util'],
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true
    })
  ]
}
