import { minerals } from './constants'
export class StatsManager {
     config?(): void
     internationalEndTick?(): void
     average?(originalNumber: number, newNumber: number, averagedOverTickCount: number): number
}

StatsManager.prototype.config = function () {
     this.internationalEndTick()
     Memory.stats.memory.limit = 2097
     Memory.stats.rooms = {}
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
