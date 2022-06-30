import { constants } from './constants'
export class StatsManager {
     roomConfig?(roomName: string, roomController?: StructureController): void
     roomPreTick?(room: Room, roomType: string): void
     roomEndTick?(room: Room, roomType: string): void
     internationalConfig?(): void
     internationalPreTick?(): void
     internationalEndTick?(): void
     average?(originalNumber: number, newNumber: number, averagedOverTickCount: number, roundDigits?: number): number
}
StatsManager.prototype.roomConfig = function (roomName: string) {
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
     if (Memory.stats.rooms[roomName] === undefined) Memory.stats.rooms[roomName] = roomStats
}
StatsManager.prototype.roomPreTick = function (room: Room, roomType: string) {
     if (!Memory.roomStats) return

     if (!constants.roomTypesUsedForStats.includes(roomType)) {
          delete Memory.stats.rooms[room.name]
          delete global.roomStats[room.name]
          return
     }
     this.roomConfig(room.name)

     const globalStats = global.roomStats[room.name]
     globalStats.cpuUsage = Game.cpu.getUsed()
}
StatsManager.prototype.roomEndTick = function (room: Room, roomType: string) {
     if (!Memory.roomStats) return

     if (!constants.roomTypesUsedForStats.includes(roomType)) {
          delete Memory.stats.rooms[room.name]
          delete global.roomStats[room.name]
          return
     }
     if (Memory.stats.rooms[room.name] === undefined || global.roomStats[room.name] === undefined) return
     const roomStats = Memory.stats.rooms[room.name]
     const globalStats = global.roomStats[room.name]

     if (Game.time % 100 === 0) {
          roomStats.controllerLevel =
               room.controller && room.controller.owner && room.controller.owner.username === Memory.me
                    ? room.controller.level + room.controller.progress / room.controller.progressTotal
                    : undefined
          roomStats.energyStored = this.average(
               roomStats.energyStored,
               room.findStoredResourceAmount(RESOURCE_ENERGY),
               10,
          )
     }
     roomStats.creepCount = this.average(roomStats.creepCount, room.myCreepsAmount, 1000, 0)
     roomStats.cpuUsage = this.average(roomStats.cpuUsage, Game.cpu.getUsed() - globalStats.cpuUsage, 1000)
     roomStats.mineralsHarvested = this.average(roomStats.mineralsHarvested, globalStats.mineralsHarvested, 10000)

     roomStats.energyInputHarvest = this.average(roomStats.energyInputHarvest, globalStats.energyInputHarvest, 1000)
     roomStats.energyInputExternalTransferred = this.average(
          roomStats.energyInputExternalTransferred,
          globalStats.energyInputExternalTransferred,
          1000,
     )
     roomStats.energyInputBought = this.average(roomStats.energyInputBought, globalStats.energyInputBought, 1000)

     roomStats.energyOutputUpgrade = this.average(roomStats.energyOutputUpgrade, globalStats.energyOutputUpgrade, 1000)
     roomStats.energyOutputBuild = this.average(roomStats.energyOutputBuild, globalStats.energyOutputBuild, 1000)
     roomStats.energyOutputRepairOther = this.average(
          roomStats.energyOutputRepairOther,
          globalStats.energyOutputRepairOther,
          1000,
     )
     roomStats.energyOutputRepairWallOrRampart = this.average(
          roomStats.energyOutputRepairWallOrRampart,
          globalStats.energyOutputRepairWallOrRampart,
          1000,
     )
     roomStats.energyOutputSold = this.average(roomStats.energyOutputSold, globalStats.energyOutputSold, 1000)
     roomStats.energyOutputSpawn = this.average(roomStats.energyOutputSold, globalStats.energyOutputSpawn, 1000)
}

StatsManager.prototype.internationalConfig = function () {
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
     }
     this.internationalEndTick()
     global.roomStats = {}
}

StatsManager.prototype.internationalPreTick = function () {
     global.roomStats = {}
}

StatsManager.prototype.internationalEndTick = function () {
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
     global.roomStats = {}

     Memory.stats.roomStatsCpuUsage1 = this.average(Memory.stats.roomStatsCpuUsage1, global.roomStatsCpuUsage1, 100)
     Memory.stats.roomStatsCpuUsage2 = this.average(Memory.stats.roomStatsCpuUsage2, global.roomStatsCpuUsage2, 100)
     Memory.stats.roomStatsRoomCount = this.average(Memory.stats.roomStatsRoomCount, global.roomStatsRoomCount, 100)
}
StatsManager.prototype.average = function (
     originalNumber: number,
     newNumber: number,
     averagedOverTickCount: number,
     roundDigits: number = 2,
): number {
     const newWeight = 1 / averagedOverTickCount
     const originalWeight = 1 - newWeight
     return parseFloat((originalNumber * originalWeight + newNumber * newWeight).toFixed(roundDigits))
}

export const statsManager = new StatsManager()
