const { join } = require('path')
const { execSync } = require('child_process')
require('dotenv').config()
const minimist = require('minimist')
const fs = require('fs')

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
const srcPath = join(__dirname, 'src')
const botPath = join(__dirname, 'dist')
console.log('START')
// execSync(
//     `npx screeps-grafana-go_carbon setup && npx screeps-grafana-go_carbon --grafanaPort=${ports.grafanaPort} --relayPort=${ports.relayPort} --force ${argv.debug ? '--debug' : ''} --deleteLogs --deleteWhisper`,
//     options,
// )

function customCopyFile(src, dest, searchText, replaceText) {
    if (fs.existsSync(dest)) return;
    const text = fs.readFileSync(src, 'utf8')

    const regex = new RegExp(searchText, 'g')
    const result = text.replace(regex, replaceText)
    fs.writeFileSync(dest, result, 'utf8')
}

customCopyFile(join(srcPath,"settings.example.ts"), join(srcPath,"settings.ts"),'Example','')
customCopyFile(join(srcPath,"other/userScript/userScript.example.ts"), join(srcPath,"other/userScript/userScript.ts"),'Example','')
execSync('npm run build', options)

const cmdString = `npx screeps-performance-server --maxTickCount=${argv.maxTicks || 20000} --maxBots=10 --botFilePath=${botPath} --steamKey=${
    process.env.STEAM_KEY
} --exportUrl=${process.env.EXPORT_API_URL} --serverPort=${ports.serverPort} --cliPort=${ports.cliPort} --force ${
    argv.debug ? '--debug' : ''
} --deleteLogs --tickDuration=${argv.tickDuration || 250} --logFilter='Error:'`;
execSync(
    cmdString,
    options,
)
// if (argv.stopGrafana) execSync('npx screeps-grafana stop')
console.log('END')
