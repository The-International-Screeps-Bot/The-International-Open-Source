import { constants, roomStats as roomStatsLevel } from './constants'
export class StatsManager {
     roomConfig(roomName: string, roomType: string) {
          if (roomType === 'commune') {
               const communeStats: RoomStats = {
                    cl: 0,
                    eih: 0,
                    eiet: 0,
                    eib: 0,
                    eou: 0,
                    eoro: 0,
                    eorwr: 0,
                    eob: 0,
                    eoso: 0,
                    eosp: 0,
                    mh: 0,
                    es: 0,
                    cc: 0,
                    cu: 0,
               }

               global.roomStats[roomName] = communeStats
               if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = communeStats
               return
          }

          const remoteStats: RoomStats = {
               eih: 0,
               eoro: 0,
               eob: 0,
               es: 0,
               cc: 0,
               cu: 0,
          }

          global.roomStats[roomName] = remoteStats
          if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = remoteStats
     }

     roomPreTick(roomName: string, roomType: string) {
          if (!global.debugRoomCount1) global.debugRoomCount1 = 0
          if (!global.debugRoomCount2) global.debugRoomCount2 = 0
          if (!global.debugRoomCount3) global.debugRoomCount3 = 0
          if (!global.debugCpu11) global.debugCpu11 = 0
          if (!global.debugCpu21) global.debugCpu11 = 0
          if (!global.debugCpu31) global.debugCpu31 = 0
          const cpu = Game.cpu.getUsed()

          this.roomConfig(roomName, roomType)

          global.roomStats[roomName].cu = Game.cpu.getUsed()
          if (roomType === 'commune') {
               global.debugCpu21 += Game.cpu.getUsed() - cpu
               global.debugRoomCount2 += 1
          } else {
               global.debugCpu31 += Game.cpu.getUsed() - cpu
               global.debugRoomCount3 += 1
          }
     }

     roomEndTick(roomName: string, roomType: string, room?: Room) {
          if (!global.debugCpu12) global.debugCpu12 = 0
          if (!global.debugCpu22) global.debugCpu22 = 0
          if (!global.debugCpu32) global.debugCpu32 = 0
          const cpu = Game.cpu.getUsed()

          const roomStats = Memory.stats.rooms[roomName]
          const globalStats = global.roomStats[roomName]

          if (Game.time % 250 === 0 && room) {
               if (Game.time % 1000 === 0 && roomType === 'commune') {
                    roomStats.cl =
                         room.controller && room.controller.owner && room.controller.owner.username === Memory.me
                              ? this.round(
                                     room.controller.level + room.controller.progress / room.controller.progressTotal,
                                     2,
                                )
                              : undefined
                    roomStats.es = room.findStoredResourceAmount(RESOURCE_ENERGY)
               }
               roomStats.cc = this.average(roomStats.cc, room.myCreepsAmount, 1000)
          }
          if (roomStatsLevel >= 2) {
               roomStats.mh = this.average(roomStats.mh, globalStats.mh, 10000)
               if (roomType === 'commune') {
                    // roomStats.eib = this.average(roomStats.eib, globalStats.eib, 1000)
                    // roomStats.eoso = this.average(roomStats.eoso, globalStats.eoso, 1000)

                    // roomStats.eiet = this.average(roomStats.eiet, globalStats.eiet, 1000)
                    roomStats.eou = this.round(this.average(roomStats.eou, globalStats.eou, 1000), 2)
                    roomStats.eorwr = this.round(this.average(roomStats.eorwr, globalStats.eorwr, 1000), 2)
                    roomStats.eosp = this.round(this.average(roomStats.eosp, globalStats.eosp, 1000), 2)
               }
               roomStats.eih = this.round(this.average(roomStats.eih, globalStats.eih, 1000), 2)

               roomStats.eob = this.round(this.average(roomStats.eob, globalStats.eob, 1000), 2)
               roomStats.eoro = this.round(this.average(roomStats.eoro, globalStats.eoro, 1000), 2)
          }

          roomStats.cu = this.round(this.average(roomStats.cu, Game.cpu.getUsed() - globalStats.cu, 1000), 2)
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
               lastTickTimestamp: 0,
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

          global.roomStats = {}
          this.internationalEndTick()
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
          Memory.stats.lastReset = (Memory.stats.lastReset || 0) + 1
          const timestamp = Date.now()
          Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp
          Memory.stats.lastTickTimestamp = timestamp
          Memory.stats.constructionSiteCount = global.constructionSitesCount
          Memory.stats.communeCount = Object.keys(Game.rooms).length

          Memory.stats.resources = {
               pixels: Game.resources[PIXEL],
               cpuUnlocks: Game.resources[CPU_UNLOCK],
               accessKeys: Game.resources[ACCESS_KEY],
               credits: Game.market.credits,
          }
          Memory.stats.cpu = {
               bucket: Game.cpu.bucket,
               usage: this.round(this.average(Memory.stats.cpu.usage, Game.cpu.getUsed(), 1000)),
          }
          console.log(Math.floor(RawMemory.get().length / 1000), Math.floor(RawMemory.get().length))
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
               Memory.stats.debugCpu11 = this.average(Memory.stats.debugCpu11, global.debugCpu11, 10)
               Memory.stats.debugCpu12 = this.average(Memory.stats.debugCpu12, global.debugCpu12, 10)
               Memory.stats.debugCpu21 = this.average(Memory.stats.debugCpu21, global.debugCpu21, 10)
               Memory.stats.debugCpu22 = this.average(Memory.stats.debugCpu22, global.debugCpu22, 10)
               Memory.stats.debugCpu31 = this.average(Memory.stats.debugCpu31, global.debugCpu31, 10)
               Memory.stats.debugCpu32 = this.average(Memory.stats.debugCpu32, global.debugCpu32, 10)
               Memory.stats.debugRoomCount1 = this.average(Memory.stats.debugRoomCount1, global.debugRoomCount1, 10)
               Memory.stats.debugRoomCount2 = this.average(Memory.stats.debugRoomCount2, global.debugRoomCount2, 10)
               Memory.stats.debugRoomCount3 = this.average(Memory.stats.debugRoomCount3, global.debugRoomCount3, 10)
          }

          const globalRoomKeys = Object.keys(global.roomStats)
          const notCheckedRooms = Object.entries(Memory.stats.rooms).filter(vk => !globalRoomKeys.find(k => k == vk[0]))
          notCheckedRooms.forEach(missingRoomData => {
               const roomType = Memory.rooms[missingRoomData[0]].type
               if (!constants.roomTypesUsedForStats.includes(roomType)) {
                    delete Memory.stats.rooms[missingRoomData[0]]
                    delete global.roomStats[missingRoomData[0]]
               } else {
                    this.roomConfig(missingRoomData[0], roomType)
                    this.roomEndTick(missingRoomData[0], roomType)
               }
          })
     }

     average(originalNumber: number, newNumber: number, averagedOverTickCount: number, roundDigits: number = 5) {
          const newWeight = 1 / averagedOverTickCount
          const originalWeight = 1 - newWeight

          return originalNumber * originalWeight + newNumber * newWeight
     }
     round(number: number, digits: number = 2) {
          return parseFloat(number.toFixed(digits))
     }
}

export const statsManager = new StatsManager()
