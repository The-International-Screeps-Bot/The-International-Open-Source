import * as dotenv from "dotenv";
dotenv.config();

import Helper from './helper.js'
import Config from './config.js'

const controllerRooms = {}
const status = {}
let lastTick = 0

process.once('SIGINT', code => {
     console.log('SIGINT received...')
     console.log(`${lastTick} End of simulation`)
     console.log('Status:')
     console.log(JSON.stringify(status, null, 2))
     console.log('Milestones:')
     console.log(JSON.stringify(Config.milestones, null, 2))
     process.exit()
})

Config.trackedRooms.forEach(room => {
     status[room] = {
          controller: null,
          creeps: 0,
          progress: 0,
          level: 0,
          structures: 0,
     }
})

class Tester {
     constructor() {
          this.roomsSeen = {}
          this.maxTicks;
          if (process.argv.length > 2) {
               try {
                    this.maxTicks = parseInt(process.argv[2], 10)
               } catch (e) {
                    console.log(`Cannot parse runtime argument ${process.argv} ${e}`)
               }
          }

          if (process.env.STEAM_API_KEY !== undefined && process.env.STEAM_API_KEY.length === 0) {
               process.env.STEAM_API_KEY = undefined
          }
     }

     /**
      *
      * @param {string} line
      * @param {object} resolve
      * @return {undefined}
      */
     async checkForSuccess(resolve, reject) {
          let appendix = ''
          if (this.maxTicks > 0) {
               appendix = ` with runtime ${this.maxTicks} ticks`
          }
          console.log(`> Start the simulation${appendix}`)
          if (this.maxTicks > 0) {
               while (lastTick === undefined || lastTick < this.maxTicks) {
                    await Helper.sleep(1)
               }
               console.log(`${lastTick} End of simulation`)
               console.log('Status:')
               console.log(JSON.stringify(status, null, 2))
               console.log('Milestones:')
               console.log(JSON.stringify(Config.milestones, null, 2))

               const fails = milestones.filter(
                    milestone => milestone.required && milestone.tick < lastTick && !milestone.success,
               )
               await Helper.sendResult(status, Config.milestones)

               if (fails.length > 0) {
                    for (const fail of fails) {
                         console.log(`${lastTick} Milestone failed ${JSON.stringify(fail)}`)
                    }
                    console.log(`${lastTick} Status check: failed`)
                    reject('Not all milestones are hit.')
                    return
               }
               console.log(`${lastTick} Status check: passed`)
               resolve()
          }
     }

     /**
      * Updates the status object
      *
      * @param {object} event
      */
     statusUpdater = event => {
          if (event.data.gameTime !== lastTick) {
               lastTick = event.data.gameTime
               for (const milestone of milestones) {
                    const failedRooms = []
                    if (typeof milestone.success === 'undefined' || milestone.success === null) {
                         let success = Object.keys(status).length === trackedRooms.length
                         for (const room of Object.keys(status)) {
                              for (const key of Object.keys(milestone.check)) {
                                   if (status[room][key] < milestone.check[key]) {
                                        success = false
                                        failedRooms.push(room)
                                        break
                                   }
                              }
                         }
                         if (success) {
                              milestone.success = event.data.gameTime < milestone.tick
                              milestone.tickReached = event.data.gameTime
                              if (milestone.success) {
                                   console.log('===============================')
                                   console.log(`${event.data.gameTime} Milestone: Success ${JSON.stringify(milestone)}`)
                              } else {
                                   console.log('===============================')
                                   console.log(
                                        `${event.data.gameTime} Milestone: Reached too late ${JSON.stringify(milestone)}`,
                                   )
                              }
                         }
                    }

                    if (milestone.success) {
                         continue
                    }

                    if (milestone.tick === event.data.gameTime) {
                         milestone.failedRooms = failedRooms
                         console.log('===============================')
                         console.log(
                              `${event.data.gameTime} Milestone: Failed ${JSON.stringify(
                                   milestone,
                              )} status: ${JSON.stringify(status)}`,
                         )
                         continue
                    }
               }
          }

          Helper.initControllerID(event, status, controllerRooms)
          if (Object.keys(event.data.objects).length > 0) {
               Helper.updateCreeps(event, status)
               Helper.updateStructures(event, status)
               Helper.updateController(event, status, controllerRooms)
          }
     }

     /**
      * execute method
      *
      * Connects via cli
      * - Spawn to bot
      * - Sets the password for the user
      * - triggers `followLog`
      * - Starts the simulation
      * - Waits
      * - Reads the controller data and checks controller progress
      * @return {object}
      */
     async execute() {
          const execute = new Promise(async (resolve, reject) => {
               await Helper.executeCliCommand(`system.resetAllData()`)
               await Helper.executeCliCommand('system.pauseSimulation()')
               await Helper.executeCliCommand(`system.setTickDuration(${Config.tickDuration})`)
               await Helper.executeCliCommand(`utils.removeBots()`)
               await Helper.executeCliCommand(`utils.setShardName("performanceServer")`)

               for (const [roomName, botName] of Object.entries(Config.rooms)) {
                    console.log(`Spawn ${botName} in ${roomName}`)
                    await Helper.executeCliCommand(`bots.spawn('${botName}', '${roomName}', {username: '${roomName}', auto:'true',cpu:'${Config.userCpu}'})\r\n`)
                    await Helper.setPassword(roomName, this.roomsSeen, Config.playerRooms)
               }

               if (Object.keys(Config.rooms).length === Object.keys(this.roomsSeen).length) {
                    console.log('Follow log')
                    await Helper.followLog(trackedRooms, statusUpdater)
                    await Helper.executeCliCommand(`system.resumeSimulation()`)
               }
               this.checkForSuccess(resolve, reject)
          })
          return execute;
     }

     async run() {
          console.log("Starting...")
          const start = Date.now()
          await Helper.initServer()
          await Helper.startServer()
          console.log("Waiting...")
          await Helper.sleep(10)
          console.log("Starting... done")
          let exitCode = 0
          try {
               await this.execute()
               console.log(`${lastTick} Yeah`)
          } catch (e) {
               exitCode = 1
               console.log(`${lastTick} ${e}`)
          }
          const end = Date.now()
          console.log(`${lastTick} ticks elapsed, ${Math.floor((end - start) / 1000)} seconds`)
          process.exit(exitCode)
     }
}

/**
 * Main method
 *
 * Start the server and connects via cli
 * @return {undefined}
 */
(async () => {
     const tester = new Tester()
     await tester.run()
})();
