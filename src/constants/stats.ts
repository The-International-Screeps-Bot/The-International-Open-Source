import { RoomStats } from 'types/stats'
import { CommuneStats } from 'types/stats'

export enum RoomStatsKeys {
  ControllerLevel = 'cl',
  EnergyInputHarvest = 'eih',
  EnergyInputBought = 'eib',
  EnergyOutputUpgrade = 'eou',
  EnergyOutputRepairOther = 'eoro',
  EnergyOutputRepairWallOrRampart = 'eorwr',
  EnergyOutputBuild = 'eob',
  EnergyOutputSold = 'eos',
  EnergyOutputSpawn = 'eosp',
  EnergyOutputPower = 'eop',
  MineralsHarvested = 'mh',
  EnergyStored = 'es',
  BatteriesStoredTimes10 = 'bes',
  CreepCount = 'cc',
  TotalCreepCount = 'tcc',
  PowerCreepCount = 'pcc',
  SpawnUsagePercentage = 'su',
  MinHaulerCost = 'mhc',
  EnergyOutputTransactionCosts = 'eotc',
  EnergyTerminalSentDomestic = 'etsd',
  EnergyTerminalSentOther = 'etso',
  CpuUsed = 'cpu',

  GameTime = 'gt',
  RemoteCount = 'rc',
  RemoteEnergyStored = 'res',
  RemoteEnergyInputHarvest = 'reih',
  RemoteEnergyOutputRepairOther = 'reoro',
  RemoteEnergyOutputBuild = 'reob',
}

export const remoteStatNames: Set<Partial<keyof CommuneStats>> = new Set([
  RoomStatsKeys.EnergyStored,
  RoomStatsKeys.EnergyInputHarvest,
  RoomStatsKeys.EnergyOutputRepairOther,
  RoomStatsKeys.EnergyOutputBuild,
])

/**
 * Names of stats to average for
 */
export const averageStatNames: Set<keyof CommuneStats | keyof RoomStats> = new Set([
  RoomStatsKeys.SpawnUsagePercentage,
  RoomStatsKeys.EnergyInputHarvest,
  RoomStatsKeys.MineralsHarvested,
  RoomStatsKeys.EnergyInputBought,
  RoomStatsKeys.EnergyOutputSold,
  RoomStatsKeys.EnergyOutputUpgrade,
  RoomStatsKeys.EnergyOutputBuild,
  RoomStatsKeys.EnergyOutputRepairOther,
  RoomStatsKeys.EnergyOutputRepairWallOrRampart,
  RoomStatsKeys.EnergyOutputSpawn,
  RoomStatsKeys.EnergyOutputPower,
  RoomStatsKeys.RemoteEnergyStored,
  RoomStatsKeys.RemoteEnergyInputHarvest,
  RoomStatsKeys.RemoteEnergyOutputRepairOther,
  RoomStatsKeys.RemoteEnergyOutputBuild,
  RoomStatsKeys.EnergyOutputTransactionCosts,
  RoomStatsKeys.EnergyTerminalSentDomestic,
  RoomStatsKeys.EnergyTerminalSentOther,
  RoomStatsKeys.CpuUsed,
])
