const { join } = require('path')
const { exec, execSync } = require('child_process')
require('dotenv').config()

const options = { stdio: 'inherit' }
const botPath = join(__dirname, 'dist')
exec(`npx screeps-grafana private`, options)
execSync('npm run build', options)
execSync(
    `npx screeps-performance-server ${process.argv[2]} ${botPath} ${process.env.STEAM_KEY} ${process.env.EXPORT_API_BASE_URL}`,
    options,
)
