import { RoomStatsKeys } from 'constants/stats'

export interface RoomStats {
  [RoomStatsKeys.GameTime]: number
  [RoomStatsKeys.RemoteCount]: number
  [RoomStatsKeys.RemoteEnergyStored]: number
  [RoomStatsKeys.RemoteEnergyInputHarvest]: number
  [RoomStatsKeys.RemoteEnergyOutputRepairOther]: number
  [RoomStatsKeys.RemoteEnergyOutputBuild]: number
}

export interface CommuneStats extends RoomStats {
    [RoomStatsKeys.ControllerLevel]: number
    [RoomStatsKeys.EnergyInputHarvest]: number
    [RoomStatsKeys.EnergyInputBought]: number
    [RoomStatsKeys.EnergyOutputUpgrade]: number
    [RoomStatsKeys.EnergyOutputRepairOther]: number
    [RoomStatsKeys.EnergyOutputRepairWallOrRampart]: number
    [RoomStatsKeys.EnergyOutputSold]: number
    [RoomStatsKeys.EnergyOutputBuild]: number
    [RoomStatsKeys.EnergyOutputSpawn]: number
    [RoomStatsKeys.EnergyOutputPower]: number
    [RoomStatsKeys.MineralsHarvested]: number
    [RoomStatsKeys.EnergyStored]: number
    [RoomStatsKeys.CreepCount]: number
    [RoomStatsKeys.TotalCreepCount]: number
    [RoomStatsKeys.PowerCreepCount]: number
    [RoomStatsKeys.SpawnUsagePercentage]: number
    [RoomStatsKeys.MinHaulerCost]: number
    [RoomStatsKeys.EnergyOutputTransactionCosts]: number
    [RoomStatsKeys.EnergyTerminalSentDomestic]: number
    [RoomStatsKeys.EnergyTerminalSentOther]: number
    [RoomStatsKeys.BatteriesStoredTimes10]: number
    [RoomStatsKeys.CpuUsed]: number
  }

export interface StatsMemory {
  lastReset: number

  lastTickTimestamp: number
  lastTick: number
  tickLength: number

  communeCount: number

  resources: {
    pixels: number
    cpuUnlocks: number
    accessKeys: number
    credits: number
  }

  cpu: {
    bucket: number
    usage: number
    limit: number
  }

  memory: {
    /**
     * percentage of Memory used
     */
    usage: number
    limit: number
  }

  /**
   * Percentage of heap used
   */
  heapUsage: number
  gcl: {
    level: number
    progress: number
    progressTotal: number
  }

  gpl: {
    level: number
    progress: number
    progressTotal: number
  }
  rooms: { [roomName: string]: Partial<CommuneStats> }
  constructionSites: number
  creeps: number
  powerCreeps: number
  defaultMinPathCacheTime: number
}
