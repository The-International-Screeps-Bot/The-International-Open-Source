const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')
const ncp = require('ncp')
const lib = require('@screeps/launcher/lib/index')
const _ = require('lodash')
const { ScreepsAPI } = require('screeps-api')

const dir = 'files/tmp-test-server'
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
          api.socket.on('connected', () => {})
          api.socket.on('auth', event => {})
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
                    `storage.db.users.update({username: '${room}'}, {$set: {password: '70dbaf0462458b31ff9b3d184d06824d1de01f6ad59cae7b5b9c01a8b530875ac502c46985b63f0c147cf59936ac1be302edc532abc38236ab59efecb3ec7f64fad7e4544c1c5a5294a8f6f45204deeb009a31dd6e81e879cfb3b7e63f3d937f412734b1a3fa7bc04bf3634d6bc6503bb0068c3f6b44f3a84b5fa421690a7399799e3be95278381ae2ac158c27f31eef99db1f21e75d285802cda983cd8a73a8a85d03ba45dcc7eb2b2ada362887df10bf74cdcca47f911147fd0946fb5119c888f048000044072dcc29b1c428b40b805cadeee7b3afc1e9d9d546c2a878ff8df9fcf805a28cc8b6e4b78051f0adb33642f1097bf0a189f388860302df6173b8e7955a35b278655df2d7615b54da6c63dc501c7914d726bea325c2225f343dff0068ac42300661664ee5611eb623e1efa379f571d46ba6a0e13a9e3e9c5bb7a772b685258f768216a830c5e9af3685898d98a9935cca2ba5efb5e1e4a9f2745c53bff318bda3e376bcd06b06d87a55045a76a1982f6e3b9fb77d39c2ff5c09c76989d1c779655bc2acdf55879b68f6155d14c26bdca3af5c7fd6de9926dbc091da280e6f7e3d727fa68c89aa8ac25b5e50bd14bf2dbcd452975710ef4b8d61a81c8f6ef2d5584eacfcb1ab4202860320f03313d23076a3b3e085af5f0a9e010ddb0ad5af57ed0db459db0d29aa2bcbcd64588d4c54d0c5265bf82f31349d9456', salt: '7eeb813417828682419582da8f997dea3e848ce8293e68b2dbb2f334b1f8949f'}})\r\n`,
               )

               if (
                    playerRooms[room]               ) {
                    console.log(`> Set steam id for ${room} for ${playerRooms[room]}`)
                    let steamId
                    switch (playerRooms[room]) {
                         case 'user1':
                              steamId = process.env.STEAM_ID_USER1
                              break
                         case 'user2':
                              steamId = process.env.STEAM_ID_USER2
                              break
                         case 'user3':
                              steamId = process.env.STEAM_ID_USER3
                              break
                    }
                    if (steamId) socket.write(
                         `storage.db.users.update({username: '${room}'}, {$set: {steam: {id: '${steamId}'}}})\r\n`,
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
     if (fs.existsSync(dir)) {
          rimraf.sync(dir)
     }
     fs.mkdirSync(dir, '0744')
     await new Promise(resolve => {
          ncp(path.resolve(__dirname, 'node_modules/@screeps/launcher/init_dist'), dir, e => {
               resolve()
          })
     })
     const configFilename = path.resolve(dir, '.screepsrc')
     let config = fs.readFileSync(configFilename, { encoding: 'utf8' })
     config = config
          .replace('{{STEAM_KEY}}', process.env.STEAM_API_KEY)
          .replace('runner_threads = 2', 'runner_threads =4')
          .replace('processors_cnt = 2', 'processors_cnt = 4')

     fs.writeFileSync(configFilename, config)
     fs.chmodSync(path.resolve(dir, 'node_modules/.hooks/install'), '755')
     fs.chmodSync(path.resolve(dir, 'node_modules/.hooks/uninstall'), '755')

     await new Promise(resolve => {
          fs.copyFile('files/mods.json', `${dir}/mods.json`, err => {
               if (err) throw err
               resolve()
          })
     })
     try {
          fs.writeFileSync(
               path.resolve(dir, 'package.json'),
               JSON.stringify(
                    {
                         name: 'my-screeps-world',
                         version: '0.0.1',
                         private: true,
                    },
                    undefined,
                    '  ',
               ),
               { encoding: 'utf8', flag: 'wx' },
          )
     } catch (e) {
          console.log(e)
     }
}
module.exports.initServer = initServer

/**
 * startServer method
 *
 * Starts the private server
 * @return {object}
 */
async function startServer() {
     process.chdir(dir)
     return lib.start({}, process.stdout)
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
     if (line.startsWith(`Screeps server v`)) {
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
          console.log(`> utils.enableGCLToCPU()`)
          socket.write(`utils.enableGCLToCPU()\r\n`)
          await sleep(5)
          console.log(`> utils.setShardName("performanceServer")`)
          socket.write(`utils.setShardName("performanceServer")\r\n`)

          const roomsObject = Object.entries(rooms);
          for (let i = 0; i < roomsObject.length; i++) {
               const room = roomsObject[i][0]
               const botName = roomsObject[i][1]
               console.log(`> Spawn as ${botName}`)
               socket.write(`bots.spawn('${botName}', '${room}', {username: '${room}', auto:'true'})\r\n`)
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
