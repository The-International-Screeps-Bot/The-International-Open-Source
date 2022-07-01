import { constants } from './constants'
export class StatsManager {
     roomConfig(roomName: string) {
          // const a = Game.cpu.getUsed()
          const roomStats: RoomStats = {
               energyInputBought: 0,
               energyInputHarvest: 0,
               energyInputExternalTransferred: 0,
               energyOutputSold: 0,
               energyOutputBuild: 0,
               energyOutputRepairOther: 0,
               energyOutputRepairWallOrRampart: 0,
               energyOutputUpgrade: 0,
               energyOutputSpawn: 0,
               mineralsHarvested: 0,
               cpuUsage: 0,
               creepCount: 0,
               energyStored: 0,
          }

          global.roomStats[roomName] = roomStats
          if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = roomStats
          // console.log(Memory.stats.rooms[roomName], Game.cpu.getUsed() - a)
     }

     roomPreTick(roomName: string, roomType: string) {
          if (!Memory.roomStats) return
          if (!global.debugRoomCount1) global.debugRoomCount1 = 0
          if (!global.debugRoomCount2) global.debugRoomCount2 = 0
          if (!global.debugRoomCount3) global.debugRoomCount3 = 0
          if (!global.debugCpu11) global.debugCpu11 = 0
          if (!global.debugCpu21) global.debugCpu12 = 0
          if (!global.debugCpu31) global.debugCpu12 = 0
          const cpu = Game.cpu.getUsed()

          if (!constants.roomTypesUsedForStats.includes(roomType)) {
               global.debugRoomCount1 += 1
               global.debugCpu11 = Game.cpu.getUsed() - cpu
               return
          }

          this.roomConfig(roomName)

          const globalStats = global.roomStats[roomName]
          globalStats.cpuUsage = Game.cpu.getUsed()
          if (roomType === 'commune') {
               global.debugRoomCount2 += 1
               global.debugCpu21 += Game.cpu.getUsed() - cpu
          } else {
               global.debugRoomCount3 += 1
               global.debugCpu31 += Game.cpu.getUsed() - cpu
          }
     }

     roomEndTick(roomName: string, roomType: string, room?: Room) {
          if (!Memory.roomStats) return
          if (!global.debugCpu21) global.debugCpu21 = 0
          if (!global.debugCpu22) global.debugCpu22 = 0
          if (!global.debugCpu32) global.debugCpu22 = 0
          const cpu = Game.cpu.getUsed()

          if (!constants.roomTypesUsedForStats.includes(roomType)) {
               global.debugCpu12 = Game.cpu.getUsed() - cpu
               return
          }

          if (Memory.stats.rooms[roomName] === undefined || global.roomStats[roomName] === undefined) return
          const roomStats = Memory.stats.rooms[roomName]
          const globalStats = global.roomStats[roomName]

          if (Game.time % 100 === 0 && room) {
               if (roomType === 'commune') {
                    roomStats.controllerLevel =
                         room.controller && room.controller.owner && room.controller.owner.username === Memory.me
                              ? room.controller.level + room.controller.progress / room.controller.progressTotal
                              : undefined
               }
               roomStats.energyStored = this.average(
                    roomStats.energyStored,
                    room.findStoredResourceAmount(RESOURCE_ENERGY),
                    10,
               )
               roomStats.creepCount = this.average(roomStats.creepCount, room.myCreepsAmount, 1000, 0)
          }
          roomStats.cpuUsage = this.average(roomStats.cpuUsage, Game.cpu.getUsed() - globalStats.cpuUsage, 1000)
          roomStats.mineralsHarvested = this.average(roomStats.mineralsHarvested, globalStats.mineralsHarvested, 10000)

          if (roomType === 'commune') {
               roomStats.energyInputBought = this.average(
                    roomStats.energyInputBought,
                    globalStats.energyInputBought,
                    1000,
               )
               roomStats.energyInputExternalTransferred = this.average(
                    roomStats.energyInputExternalTransferred,
                    globalStats.energyInputExternalTransferred,
                    1000,
               )
               roomStats.energyOutputUpgrade = this.average(
                    roomStats.energyOutputUpgrade,
                    globalStats.energyOutputUpgrade,
                    1000,
               )
               roomStats.energyOutputRepairWallOrRampart = this.average(
                    roomStats.energyOutputRepairWallOrRampart,
                    globalStats.energyOutputRepairWallOrRampart,
                    1000,
               )
               roomStats.energyOutputSold = this.average(roomStats.energyOutputSold, globalStats.energyOutputSold, 1000)
               roomStats.energyOutputSpawn = this.average(
                    roomStats.energyOutputSold,
                    globalStats.energyOutputSpawn,
                    1000,
               )
          }
          roomStats.energyInputHarvest = this.average(
               roomStats.energyInputHarvest,
               globalStats.energyInputHarvest,
               1000,
          )

          roomStats.energyOutputBuild = this.average(roomStats.energyOutputBuild, globalStats.energyOutputBuild, 1000)
          roomStats.energyOutputRepairOther = this.average(
               roomStats.energyOutputRepairOther,
               globalStats.energyOutputRepairOther,
               1000,
          )
          if (roomType === 'commune') {
               global.debugCpu22 += Game.cpu.getUsed() - cpu
          } else {
               global.debugCpu32 += Game.cpu.getUsed() - cpu
          }
     }

     internationalConfig() {
          Memory.stats = {
               lastReset: 0,
               tickLength: 0,
               communeCount: 0,
               resources: {
                    pixels: 0,
                    cpuUnlocks: 0,
                    accessKeys: 0,
                    credits: 0,
               },
               cpu: {
                    bucket: 0,
                    usage: 0,
               },
               memory: {
                    usage: 0,
                    limit: 2097,
               },
               gcl: {
                    level: 0,
                    progress: 0,
                    progressTotal: 0,
               },
               gpl: {
                    level: 0,
                    progress: 0,
                    progressTotal: 0,
               },
               rooms: {},
               constructionSiteCount: 0,
               debugCpu11: 0,
               debugCpu12: 0,
               debugCpu21: 0,
               debugCpu22: 0,
               debugCpu31: 0,
               debugCpu32: 0,
               debugRoomCount1: 0,
               debugRoomCount2: 0,
               debugRoomCount3: 0,
          }

          this.internationalEndTick()
          global.roomStats = {}
     }

     internationalPreTick() {
          global.roomStats = {}
          global.debugCpu11 = 0
          global.debugCpu12 = 0
          global.debugCpu21 = 0
          global.debugCpu22 = 0
          global.debugCpu31 = 0
          global.debugCpu32 = 0
          global.debugRoomCount1 = 0
          global.debugRoomCount2 = 0
          global.debugRoomCount3 = 0
     }

     internationalEndTick() {
          Memory.stats.lastReset = (Memory.stats?.lastReset || 0) + 1
          Memory.stats.tickLength = this.average(
               Memory.stats.tickLength,
               Date.now() - (Memory.stats?.tickLength || Date.now()),
               10000,
          )
          Memory.stats.constructionSiteCount = global.constructionSitesCount
          Memory.stats.communeCount = Object.keys(Game.rooms).length

          Memory.stats.resources = {
               pixels: Game.resources[PIXEL],
               cpuUnlocks: Game.resources[CPU_UNLOCK],
               accessKeys: Game.resources[ACCESS_KEY],
               credits: Game.market.credits,
          }
          Memory.stats.cpu = {
               bucket: this.average(Memory.stats.cpu.bucket, Game.cpu.bucket, 1000, 0),
               usage: this.average(Memory.stats.cpu.usage, Game.cpu.getUsed(), 1000, 2),
          }
          Memory.stats.memory.usage = Math.floor(RawMemory.get().length / 1000)
          Memory.stats.memory.usage = 0
          Memory.stats.gcl = {
               progress: Game.gcl.progress,
               progressTotal: Game.gcl.progressTotal,
               level: Game.gcl.level,
          }
          Memory.stats.gpl = {
               progress: Game.gpl.progress,
               progressTotal: Game.gpl.progressTotal,
               level: Game.gpl.level,
          }

          if (global.debugCpu21) {
               Memory.stats.debugCpu11 = this.average(Memory.stats.debugCpu11, global.debugCpu11, 10, 10)
               Memory.stats.debugCpu12 = this.average(Memory.stats.debugCpu12, global.debugCpu12, 10, 10)
               Memory.stats.debugCpu21 = this.average(Memory.stats.debugCpu21, global.debugCpu21, 10, 10)
               Memory.stats.debugCpu22 = this.average(Memory.stats.debugCpu22, global.debugCpu22, 10, 10)
               Memory.stats.debugCpu31 = this.average(Memory.stats.debugCpu31, global.debugCpu31, 10, 10)
               Memory.stats.debugCpu32 = this.average(Memory.stats.debugCpu32, global.debugCpu32, 10, 10)
               Memory.stats.debugRoomCount1 = this.average(Memory.stats.debugRoomCount1, global.debugRoomCount1, 10)
               Memory.stats.debugRoomCount2 = this.average(Memory.stats.debugRoomCount2, global.debugRoomCount2, 10)
               Memory.stats.debugRoomCount3 = this.average(Memory.stats.debugRoomCount3, global.debugRoomCount3, 10)
          }

          // find all rooms that are missing in roomStats
          function differenceInArray(arr1: string[], arr2: string[]) {
               return arr1.filter(a => !arr2.find(v => v[0] == a[0]))
          }
          const globalRoomKeys = Object.keys(global.roomStats)
          const notCheckedRooms = Object.keys(Memory.stats.rooms).filter(a => !globalRoomKeys.find(v => v == a))
          notCheckedRooms.forEach(missingRoom => {
               const roomType = Memory.rooms[missingRoom].type
               if (!constants.roomTypesUsedForStats.includes(roomType)) {
                    delete Memory.stats.rooms[missingRoom]
                    delete global.roomStats[missingRoom]
               } else {
                    this.roomConfig(missingRoom)
                    this.roomEndTick(missingRoom, roomType)
               }
          })
     }

     average(originalNumber: number, newNumber: number, averagedOverTickCount: number, roundDigits: number = 4) {
          const newWeight = 1 / averagedOverTickCount
          const originalWeight = 1 - newWeight

          return parseFloat((originalNumber * originalWeight + newNumber * newWeight).toFixed(roundDigits))
     }
}

export const statsManager = new StatsManager()
