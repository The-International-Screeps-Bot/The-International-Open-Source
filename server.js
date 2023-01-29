const { join } = require('path')
const { execSync } = require('child_process')
require('dotenv').config()
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))

function getPorts() {
    const runnerName = process.env.ACTIONS_RUNNER_NAME || 'local - 21025';
    const basePort = runnerName.split(' - ')[1] || 21025;
    const baseServerPort = 21025;
    const baseCliPort = 22025;
    const baseGrafanaPort = 3000;
    const baseRelayPort = 2003;
    const additionalPort = basePort - baseServerPort;

    const serverPort = baseServerPort + additionalPort;
    const cliPort = baseCliPort + additionalPort;
    const grafanaPort = baseGrafanaPort + additionalPort;
    const relayPort = baseRelayPort + additionalPort;
    if (!runnerName.includes("local")) console.log(`Runner name: ${runnerName}, base port: ${basePort}`);
    return { serverPort, cliPort, grafanaPort, relayPort };
}

const ports = getPorts()

const options = { stdio: 'inherit' }
const botPath = join(__dirname, 'dist')
console.log('START')
execSync(`npx screeps-grafana private --grafanaPort=${ports.grafanaPort} --relayPort=${ports.relayPort} --force`, options)
execSync('npm run build', options)
execSync(
    `npx screeps-performance-server --maxTicks=${argv.maxTicks} --maxBots=9 --botFilePath=${botPath} --steamKey=${process.env.STEAM_KEY} --exportBaseUrl=${process.env.EXPORT_API_BASE_URL} --serverPort=${ports.serverPort} --cliPort=${ports.cliPort} --force`,
    options,
)
if (argv.stopGrafana) execSync("npx screeps-grafana stop")
console.log('END')
