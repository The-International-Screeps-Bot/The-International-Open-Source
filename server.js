const { join } = require('path')
const { execSync } = require('child_process')
require('dotenv').config()
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))

function getPorts() {
    const runnerName = process.env.ACTIONS_RUNNER_NAME || 'local - 21025'
    const basePort = runnerName.split(' - ')[1] || 21025
    const baseServerPort = 21025
    const baseCliPort = 22025
    const baseGrafanaPort = 3000
    const baseRelayPort = 2003
    const additionalPort = basePort - baseServerPort

    const serverPort = baseServerPort + additionalPort
    const cliPort = baseCliPort + additionalPort
    const grafanaPort = baseGrafanaPort + additionalPort
    const relayPort = baseRelayPort + additionalPort
    if (!runnerName.includes('local')) console.log(`Runner name: ${runnerName}, base port: ${basePort}`)
    return { serverPort, cliPort, grafanaPort, relayPort }
}

const ports = getPorts()

const options = { stdio: 'inherit' }
const botPath = join(__dirname, 'dist')
console.log('START')
execSync(
    `npx screeps-grafana --grafanaType=private --grafanaPort=${ports.grafanaPort} --serverPort=${
        ports.serverPort
    } --relayPort=${ports.relayPort} --force ${argv.debug ? '--debug' : ''} --deleteLogs --deleteWhisper`,
    options,
)
execSync('npm run build', options)
execSync(
    `npx screeps-performance-server --maxTicks=${argv.maxTicks} --maxBots=9 --botFilePath=${botPath} --steamKey=${
        process.env.STEAM_KEY
    } --exportUrl=${process.env.EXPORT_API_URL} --serverPort=${ports.serverPort} --cliPort=${ports.cliPort} --force ${
        argv.debug ? '--debug' : ''
    } --disableMongo  --deleteLogs --tickDuration=${argv.tickDuration || 250}`,
    options,
)
if (argv.stopGrafana) execSync('npx screeps-grafana stop')
console.log('END')
