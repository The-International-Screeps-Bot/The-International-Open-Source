const fs = require('fs')

fs.copyFileSync('src/settings.example.ts', 'src/settings.ts')
fs.copyFileSync('src/other/userScript/userScript.example.ts', 'src/other/userScript/userScript.ts')

const settings = fs.readFileSync('src/settings.ts', 'utf8')
const newSettings = settings.replaceAll('Example', '',)
fs.writeFileSync('src/settings.ts', newSettings)

const userScript = fs.readFileSync('src/other/userScript/userScript.ts', 'utf8')
const newUserScript = userScript.replaceAll('Example', '')
fs.writeFileSync('src/other/userScript/userScript.ts', newUserScript)
