const { execSync } = require('child_process')

const tokens = []
tokens.forEach(token => {
    execSync(`npx rollup -c --environment TOKEN:${token}`)
})
