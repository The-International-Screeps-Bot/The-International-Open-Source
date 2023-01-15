const { join } = require('path')
const { exec, execSync } = require('child_process')
require('dotenv').config()
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))

const runnerName = process.env.ACTIONS_RUNNER_NAME;
console.log("runnerName: " + runnerName);

const options = { stdio: 'inherit' }
const botPath = join(__dirname, 'dist')
exec(`npx screeps-grafana private`, options)
execSync('npm run build', options)
execSync(
    `npx screeps-performance-server --maxTicks=${argv.maxTicks} --botFilePath=${botPath} --steamKey=${process.env.STEAM_KEY} --exportBaseUrl=${process.env.EXPORT_API_BASE_URL}`,
    options,
)
