const fs = require('fs')
const fetch = require('node-fetch')
const rimraf = require('rimraf')
const path = require('path')
const ncp = require('ncp')
const lib = require('@screeps/launcher/lib/index')
const _ = require('lodash')
const { ScreepsAPI } = require('screeps-api')
const { exec,execSync } = require('child_process')

const { userCpu } = require('./config')

const port = 21025
let hostname = '127.0.0.1'

function setHostname(newHostname) {
     hostname = newHostname
}
module.exports.setHostname = setHostname

/**
 * followLog method
 *
 * Connects to the api and reads and prints the console log, if messages
 * are available
 *
 * @param {list} rooms - The rooms
 * @param {function} statusUpdater - Function to handle status updates
 * @return {undefined}
 */
async function followLog(rooms, statusUpdater, restrictToRoom) {
     for (const room of rooms) {
          if (restrictToRoom && room !== restrictToRoom) {
               continue
          }
          const api = new ScreepsAPI({
               email: room,
               password: 'tooangel',
               protocol: 'http',
               hostname,
               port,
               path: '/',
          })

          await api.auth()

          api.socket.connect()
          api.socket.on('connected', () => { })
          api.socket.on('auth', event => { })
          api.socket.subscribe(`room:${room}`, statusUpdater)
     }
}
module.exports.followLog = followLog

/**
 * sets password for user
 *
 * @param {string} line
 * @param {object} socket
 * @param {list} rooms
 * @param {object} roomsSeen
 * @param {stringMap} playerRooms
 * @return {boolean}
 */
const setPassword = function (line, socket, rooms, roomsSeen, playerRooms) {
     const roomsObject = Object.entries(rooms);
     for (let i = 0; i < roomsObject.length; i++) {
          const room = roomsObject[i][0]
          const botName = roomsObject[i][1]
          if (line.startsWith(`'User ${room} with bot AI "${botName}" spawned in ${room}'`)) {
               roomsSeen[room] = true
               console.log(`> Set password for ${room}`)
               /* eslint max-len: ["error", 1300] */
               socket.write(
                    `storage.db.users.update({username: '${room}'}, {$set: {password: '552054d48055ed1e16ca31df0aad5d98f5860c0a69074bac119c563e8b4c33815469eea39e4c63269c70c56ada6aa32e557a76826605912e5a5766f8849df8604c576ef57967dfc8f82e2af1d4335973fdc43c61fc06e3e97c9b5305bde30431865eeee34d42b257425fe8b352706efcc89eb4c2d446f24c51103d90bc736e8951b19a4fd0acf16349a67bd5d9c173d2c32963d599588919a8b3277228e12a01c6d90350efddac24f0395ce9666584e714a42e427cc4249e613d761fa39b9d09432e2e3b0d191245d838231a3bcf24dff1e6b50066aa70c048f4e53dce2b631c134a83bc8f8ae9542db2763aba8556285010a35db8882f2ebdb8c3b05b9d32acb4b0eeae036bc82473086fbb47cf838b5179cd2063388da505bd80c0a5bf0cc5b47068a94d1e4f436a2edcbefd4b5d24f6ea0486e17443991f9bcd1aa05f34faa7fa77c71b47b0cc7f7fb352ec36f1f343cba948205005dd55b4aa270d3ea5da4bcff57a58241860365a1e2f4ec15d610ea8bf0ff1898ed342dbb6c7c19ff93b77fd5928782ac96bc554db023bdbe99f51f3ed147c54561ba474c65065713783022d11ba69bea54e3bd42756481e4d68568dde41ce4ffb52216c08085c27594bbea23a0370125c687e931f448d7b5245ebd869450eed6077214c1750a52a359d0d2425b2e689fd456761e8edd4b6c751150ef391e8a5d232ecb50a888adb6169', salt: '857e347a9e3a8fd4e6eb770c9c0ff819de3b006b3faa9fe984f82f36deeba1bd'}})\r\n`,
               )

               if (
                    playerRooms[room]) {
                    console.log(`> Set steam id for ${room}`)
                    socket.write(
                         `storage.db.users.update({username: '${room}'}, {$set: {steam: {id: '${playerRooms[room]}'}}})\r\n`,
                    )
               }
               return true
          }
     }
     return false
}
module.exports.setPassword = setPassword

/**
 * sleep method
 *
 * Helper method to sleep for amount of seconds.
 * @param {number} seconds Amount of seconds to sleep
 * @return {object}
 */
function sleep(seconds) {
     return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}
module.exports.sleep = sleep

async function initServer() {
     if (!process.env.STEAM_API_KEY) return;
     const configFilename = path.resolve("files", 'config.yml')
     let config = fs.readFileSync(configFilename, { encoding: 'utf8' })
     config = config
          .replace('{{STEAM_KEY}}', process.env.STEAM_API_KEY)

     fs.writeFileSync(configFilename, config)
     fs.copyFileSync(path.resolve("files", 'config.yml'), path.resolve("files/server", 'config.yml'))
}
module.exports.initServer = initServer

/**
 * startServer method
 *
 * Starts the private server
 * @return {object}
 */
async function startServer() {
     // if
     try {
          execSync("docker stop Screeps-Performance-Server")
          execSync("docker rm -v Screeps-Performance-Server")
     } catch (error) {
          console.log(error)
     }
     const folderPath = path.resolve("files/server")
     const command = `docker run --restart=unless-stopped --name Screeps-Performance-Server -v ${folderPath}:/screeps -p 21025-21026:21025-21026 screepers/screeps-launcher`
     let maxTime = new Promise((resolve, reject) => {
          setTimeout(resolve, 300 * 1000, 'Timeout')
     })
     const startServer = new Promise((resolve, reject) => {
          const child = exec(command);
          child.stderr.on('data', function (data) {
               if (data.includes('Started')) {
                    console.log("Started server")
                    resolve();
               }
            });

     })
     return await Promise.race([startServer, maxTime])
     .then(result => {
          if (result === 'Timeout') {
               console.log("Timeout starting server!")
               return
          }
          return
     })
     .catch(result => {
          logger.log('error', {data:result,options})
     })
}
module.exports.startServer = startServer

/**
 * spawns Bot
 *
 * @param {string} line
 * @param {object} socket
 * @param {list} rooms
 * @param {array} players
 * @param {number} tickDuration
 * @return {boolean}
 */
const spawnBots = async function (line, socket, rooms, tickDuration) {
     if (line === "Started") {
          console.log(`> system.resetAllData()`)
          socket.write(`system.resetAllData()\r\n`)
          await sleep(5)
          console.log(`> system.pauseSimulation()`)
          socket.write(`system.pauseSimulation()\r\n`)
          await sleep(5)
          console.log(`> system.setTickDuration(${tickDuration})`)
          socket.write(`system.setTickDuration(${tickDuration})\r\n`)
          await sleep(5)
          console.log(`> utils.removeBots()`)
          socket.write(`utils.removeBots()\r\n`)
          await sleep(5)
          console.log(`> utils.setShardName("performanceServer")`)
          socket.write(`utils.setShardName("performanceServer")\r\n`)

          const roomsObject = Object.entries(rooms);
          for (let i = 0; i < roomsObject.length; i++) {
               const room = roomsObject[i][0]
               const botName = roomsObject[i][1]
               console.log(`> Spawn as ${botName}`)
               socket.write(`bots.spawn('${botName}', '${room}', {username: '${room}', auto:'true',cpu:'${userCpu}'})\r\n`)
               await sleep(5)
          }
          return true
     }
     return false
}
module.exports.spawnBots = spawnBots

const filter = {
     controller: o => {
          if (o && o.type) {
               return o.type === 'controller'
          }
          return false
     },
     creeps: o => {
          if (o && o.type) {
               return o.type === 'creep'
          }
          return false
     },
     structures: o => {
          if (o && o.type) {
               return o.type === 'spawn' || o.type === 'extension'
          }
          return false
     },
}

const helpers = {
     initControllerID(event, status, controllerRooms) {
          if (status[event.id].controller === null) {
               status[event.id].controller = _.filter(event.data.objects, filter.controller)[0]
               status[event.id].controller = status[event.id].controller._id
               controllerRooms[status[event.id].controller] = event.id
          }
     },
     updateCreeps(event, status) {
          const creeps = _.filter(event.data.objects, filter.creeps)
          if (_.size(creeps) > 0) {
               status[event.id].creeps += _.size(creeps)
          }
     },
     updateStructures(event, status) {
          const structures = _.filter(event.data.objects, filter.structures)
          if (_.size(structures) > 0) {
               status[event.id].structures += _.size(structures)
          }
     },
     updateController(event, status, controllerRooms) {
          const controllers = _.pick(event.data.objects, Object.keys(controllerRooms))
          for (const controllerId of Object.keys(controllers)) {
               const controller = controllers[controllerId]
               const roomName = controllerRooms[controllerId]
               if (status[roomName] === undefined) {
                    continue
               }
               if (controller.progress >= 0) {
                    status[roomName].progress = controller.progress
               }
               if (controller.level >= 0) {
                    status[roomName].level = controller.level
               }
          }
     },
}
module.exports.helpers = helpers

async function SendResult(milestones,status) {
     let commitName = 'localhost'
     if (process.env.GITHUB_EVENT_PATH) {
          const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
          const object = JSON.parse(file);
          commitName = object["commits"][0].message;
     }
     try {
          await fetch('http://localhost:5000', {
               method: 'POST', body: JSON.stringify({ milestones, lastTick, status, commitName }), headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
               }
          });
     } catch (error) { }
}
module.exports.sendResult = SendResult
