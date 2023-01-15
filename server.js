const { join } = require('path')
const { exec, execSync } = require('child_process')
require('dotenv').config()
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))

const runnerName = process.env.ACTIONS_RUNNER_NAME;
console.log("runnerName: " + runnerName);

const grafanaPort = 3000
const relayPort = 2003
const serverPort = 21025
const cliPort = 21026

const options = { stdio: 'inherit' }
const botPath = join(__dirname, 'dist')
exec(`npx screeps-grafana private --grafanaPort=${grafanaPort} --relayPort=${relayPort}`, options)
execSync('npm run build', options)
execSync(
    `npx screeps-performance-server --maxTicks=${argv.maxTicks} --botFilePath=${botPath} --steamKey=${process.env.STEAM_KEY} --exportBaseUrl=${process.env.EXPORT_API_BASE_URL} --serverPort=${serverPort} --cliPort=${cliPort} --grafanaPort=${grafanaPort}`,
    options,
)
