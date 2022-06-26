const {execSync} = require('child_process')

const tokens = [process.env.PANDAMASTER_TOKEN ];
tokens.forEach(token => {
    execSync(`npx rollup -c --environment TOKEN:${token}`)
})

