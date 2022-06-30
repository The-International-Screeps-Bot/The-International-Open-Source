import { constants } from './constants'
export class StatsManager {
     roomConfig?(room: Room): void
     roomPreTick?(room: Room): void
     roomEndTick?(room: Room): void
     internationalConfig?(): void
     internationalPreTick?(): void
     internationalEndTick?(): void
     average?(originalNumber: number, newNumber: number, averagedOverTickCount: number): number
}
StatsManager.prototype.roomConfig = function (room: Room) {
     const roomStats: RoomStats = {
          controllerLevel: room.controller
               ? room.controller.level + room.controller.progress / room.controller.progressTotal
               : undefined,
          energyInput: {
               bought: 0,
               harvest: 0,
               externalTransferred: 0,
          },
          energyOutput: {
               sold: 0,
               build: 0,
               repair: {
                    other: 0,
                    wallOrRampart: 0,
               },
               upgrade: 0,
               spawn: 0,
          },
          mineralsHarvested: 0,
          energyStored: 0,
          creepCount: 0,
          cpuUsage: 0,
     }
     global.roomStats[room.name] = roomStats
     if (Memory.stats.rooms[room.name] === undefined) Memory.stats.rooms[room.name] = roomStats
}
StatsManager.prototype.roomPreTick = function (room: Room) {
     if (!global.roomStatsCpuUsage) global.roomStatsCpuUsage = 0
     const startCpu = Game.cpu.getUsed()

     if (!constants.roomTypesUsedForStats.includes(room.memory.type)) {
          delete Memory.stats.rooms[room.name]
          delete global.roomStats[room.name]
          return
     }
     this.roomConfig(room)

     const globalStats = global.roomStats[room.name]
     globalStats.cpuUsage = Game.cpu.getUsed()
     global.roomStatsCpuUsage += Game.cpu.getUsed() - startCpu
}
StatsManager.prototype.roomEndTick = function (room: Room) {
     const startCpu = Game.cpu.getUsed()

     if (!constants.roomTypesUsedForStats.includes(room.memory.type)) {
          delete Memory.stats.rooms[room.name]
          delete global.roomStats[room.name]
          return
     }

     if (Memory.stats.rooms[room.name] === undefined || global.roomStats[room.name] === undefined) return
     const roomStats = Memory.stats.rooms[room.name]
     const globalStats = global.roomStats[room.name]

     ;(roomStats.controllerLevel = room.controller
          ? room.controller.level + room.controller.progress / room.controller.progressTotal
          : undefined),
          (roomStats.creepCount = this.average(roomStats.creepCount, room.myCreepsAmount, 1000))
     roomStats.cpuUsage = this.average(roomStats.cpuUsage, Game.cpu.getUsed() - globalStats.cpuUsage, 1000)
     roomStats.energyStored = this.average(roomStats.energyStored, room.findStoredResourceAmount(RESOURCE_ENERGY), 1000)
     roomStats.mineralsHarvested = this.average(roomStats.mineralsHarvested, globalStats.mineralsHarvested, 10000)

     roomStats.energyInput.harvest = this.average(roomStats.energyInput.harvest, globalStats.energyInput.harvest, 1000)
     roomStats.energyInput.externalTransferred = this.average(
          roomStats.energyInput.externalTransferred,
          globalStats.energyInput.externalTransferred,
          1000,
     )
     roomStats.energyInput.bought = this.average(roomStats.energyInput.bought, globalStats.energyInput.bought, 1000)

     roomStats.energyOutput.upgrade = this.average(
          roomStats.energyOutput.upgrade,
          globalStats.energyOutput.upgrade,
          1000,
     )
     roomStats.energyOutput.build = this.average(roomStats.energyOutput.build, globalStats.energyOutput.build, 1000)
     roomStats.energyOutput.repair.other = this.average(
          roomStats.energyOutput.repair.other,
          globalStats.energyOutput.repair.other,
          1000,
     )
     roomStats.energyOutput.repair.wallOrRampart = this.average(
          roomStats.energyOutput.repair.wallOrRampart,
          globalStats.energyOutput.repair.wallOrRampart,
          1000,
     )
     roomStats.energyOutput.sold = this.average(roomStats.energyOutput.sold, globalStats.energyOutput.sold, 1000)
     roomStats.energyOutput.spawn = this.average(roomStats.energyOutput.sold, globalStats.energyOutput.spawn, 1000)

     global.roomStatsCpuUsage += Game.cpu.getUsed() - startCpu
}

StatsManager.prototype.internationalConfig = function () {
     this.internationalEndTick()
     Memory.stats.memory.limit = 2097
     Memory.stats.rooms = {}
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
     Memory.stats.communeCount = Object.keys(Game.rooms).length
     Memory.stats.resources = {
          pixels: Game.resources[PIXEL],
          cpuUnlocks: Game.resources[CPU_UNLOCK],
          accessKeys: Game.resources[ACCESS_KEY],
          credits: Game.market.credits,
     }
     Memory.stats.cpu = {
          bucket: this.average(Memory.stats.cpu.bucket, Game.cpu.bucket, 1000),
          usage: this.average(Memory.stats.cpu.usage, Game.cpu.getUsed(), 1000),
     }
     Memory.stats.memory.usage = Math.floor(RawMemory.get().length / 1000)
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
     Memory.stats.constructionSiteCount = global.constructionSitesCount
     global.roomStats = {}

     Memory.stats.roomStatsCpuUsage = this.average(Memory.stats.roomStatsCpuUsage, global.roomStatsCpuUsage, 500)
}
StatsManager.prototype.average = function (
     originalNumber: number,
     newNumber: number,
     averagedOverTickCount: number,
): number {
     const newWeight = 1 / averagedOverTickCount
     const originalWeight = 1 - newWeight
     return originalNumber * originalWeight + newNumber * newWeight
}

export const statsManager = new StatsManager()
