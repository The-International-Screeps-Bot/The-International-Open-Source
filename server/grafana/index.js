const axios = require('axios').default
const fs = require('fs')
const dashboardHelper = require('./dashboards/helper.js')
const powerShell = require('node-powershell').PowerShell
const { execSync } = require('child_process')
const isWindows = process.platform.includes('win')
function sleep(milliseconds) {
     return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const dashboards = dashboardHelper.getDashboards()

;(async function () {
     let ps
     if (isWindows)
          ps = new powerShell({
               executionPolicy: 'Default',
               noProfile: true,
          })

     const commands = [
          'docker-compose down',
          'docker-compose build',
          'docker volume rm $(docker volume ls -q)',
          'docker network create grafana_default',
          'docker-compose up -d'
     ]

     if (!fs.existsSync("./users.js")) {
          fs.copyFileSync("./users.js.example", "./users.js")
      }

     for (let i = 0; i < commands.length; i++) {
          try {
               if (isWindows) await ps.invoke(commands[i])
               else execSync(commands[i], (err, stdout, stderr) => { })
               await sleep(30*1000)
          } catch (error) {
               console.log('Command index ' + i, error)
          }
     }
     console.log('Pre setup done!')
     if (isWindows) ps.dispose()

     const grafanaUrl = 'http://localhost:3000'

     async function SetupDataSources() {
          try {
               await axios({
                    url: grafanaUrl + '/api/datasources',
                    method: 'post',
                    auth: {
                         username: 'admin',
                         password: 'password',
                    },
                    data: {
                         name: 'Graphite',
                         type: 'graphite',
                         url: `http://api:8080`,
                         access: 'proxy',
                         isDefault: true,
                    },
               })
          } catch (err) {
               console.log(err)
          }
     }

     async function SetupServiceInfoDashboard() {
          try {
               const dashboard = dashboards.serviceInfo
               await axios({
                    url: grafanaUrl + '/api/dashboards/db',
                    method: 'post',
                    auth: {
                         username: 'admin',
                         password: 'password',
                    },
                    data: dashboard,
               })
          } catch (err) {
               console.log(err)
          }
     }
     async function SetupStatsDashboard() {
          try {
               const dashboard = dashboards.stats
               await axios({
                    url: grafanaUrl + '/api/dashboards/db',
                    method: 'post',
                    auth: {
                         username: 'admin',
                         password: 'password',
                    },
                    data: dashboard,
               })
          } catch (err) {
               console.log(err)
          }
     }
     async function SetupServerStatsDashboard() {
          try {
               const dashboard = dashboards.serverStats
               await axios({
                    url: grafanaUrl + '/api/dashboards/db',
                    method: 'post',
                    auth: {
                         username: 'admin',
                         password: 'password',
                    },
                    data: dashboard,
               })
          } catch (err) {
               console.log(err)
          }
     }
     await sleep(30*1000)
     await SetupDataSources()
     await sleep(15*1000)

     await SetupServiceInfoDashboard()
     await SetupStatsDashboard()
     await SetupServerStatsDashboard()
     console.log('Setup done!')
})()
