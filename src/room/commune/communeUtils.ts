import { packCoord, unpackCoord } from 'other/codec'
import { CommuneDataOps, communeData } from './communeData'
import { RoomDataOps, roomData } from 'room/roomData'
import { findLinkThroughput, getRange, packAsNum, unpackNumAsCoord } from 'utils/utils'
import {
  Result,
  RoomMemoryKeys,
  generalRepairStructureTypes,
  packedPosLength,
  structureTypesToProtectSet,
} from '../../constants/general'
import { CollectiveManager } from 'international/collective'
import { RoomUtils } from 'room/roomUtils'
import { StructureUtils } from 'room/structureUtils'
import { OrganizedSpawns } from './spawning/spawningStructureOps'
import { ResourceTargets } from './commune'
import { RoomOps } from 'room/roomOps'

export class CommuneUtils {
  static getGeneralRepairStructures(room: Room) {
    if (room.generalRepairStructures) return room.generalRepairStructures

    const repairTargets = this.getGeneralRepairStructuresFromCoords(room)
    if (repairTargets.length) {
      room.generalRepairStructures = repairTargets
      return repairTargets
    }

    const structureCoords = new Set<string>()
    const basePlans = room.roomManager.basePlans

    for (const packedCoord in basePlans.map) {
      const coordData = basePlans.map[packedCoord]
      for (const data of coordData) {
        if (data.minRCL > room.controller.level) continue
        if (
          !generalRepairStructureTypes.has(
            data.structureType as STRUCTURE_ROAD | STRUCTURE_CONTAINER,
          )
        )
          break

        structureCoords.add(packedCoord)

        const coord = unpackCoord(packedCoord)
        const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(
          coord,
          structure => generalRepairStructureTypes.has(structure.structureType),
        )
        if (!structure) continue

        repairTargets.push(structure)
        break
      }
    }

    communeData[room.name].generalRepairStructureCoords = structureCoords

    room.generalRepairStructures = repairTargets
    return repairTargets
  }

  private static getGeneralRepairStructuresFromCoords(room: Room) {
    const repairTargets: (StructureContainer | StructureRoad)[] = []
    const structureCoords = communeData[room.name].generalRepairStructureCoords
    if (!structureCoords) return repairTargets

    for (const packedCoord of structureCoords) {
      const coord = unpackCoord(packedCoord)

      const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(
        coord,
        structure => generalRepairStructureTypes.has(structure.structureType),
      )
      if (!structure) return []

      repairTargets.push(structure)
    }

    return repairTargets
  }

  static getRampartRepairTargets(room: Room) {
    if (room.rampartRepairStructures) return room.rampartRepairStructures

    const repairTargets: StructureRampart[] = []
    const rampartPlans = room.roomManager.rampartPlans
    const buildSecondMincutLayer = room.communeManager.buildSecondMincutLayer
    const nukeTargetCoords = room.roomManager.nukeTargetCoords

    for (const structure of room.roomManager.structures.rampart) {
      const data = rampartPlans.map[packCoord(structure.pos)]
      if (!data) continue

      if (data.minRCL > room.controller.level) continue
      if (
        data.coversStructure &&
        !room.coordHasStructureTypes(structure.pos, structureTypesToProtectSet)
      ) {
        continue
      }

      if (data.buildForNuke) {
        if (!nukeTargetCoords[packAsNum(structure.pos)]) continue

        repairTargets.push(structure)
        continue
      }
      if (data.buildForThreat) {
        if (!buildSecondMincutLayer) continue

        repairTargets.push(structure)
        continue
      }

      repairTargets.push(structure)
    }

    room.rampartRepairStructures = repairTargets
    return repairTargets
  }

  /**
   * The presently desired upgrader strength for the commune based on energy thresholds
   */
  static getDesiredUpgraderStrength(room: Room) {
    const strength = Math.pow(
      (room.roomManager.resourcesInStoringStructures.energy -
        this.storedEnergyUpgradeThreshold(room) * 0.5) /
        (6000 + room.controller.level * 2000),
      2,
    )

    return strength
  }

  static getMaxUpgradeStrength(room: Room) {
    const data = communeData[room.name]
    if (data.maxUpgradeStrength !== undefined && !room.roomManager.structureUpdate)
      return data.maxUpgradeStrength

    let maxUpgradeStrength = 0

    const upgradeStructure = room.communeManager.upgradeStructure
    if (!upgradeStructure) return room.communeManager.findNudeMaxUpgradeStrength()

    // Container

    if (upgradeStructure.structureType === STRUCTURE_CONTAINER) {
      maxUpgradeStrength =
        upgradeStructure.store.getCapacity() /
        (4 + room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength)

      data.maxUpgradeStrength = maxUpgradeStrength
      return maxUpgradeStrength
    }

    // Link

    const hubLink = room.roomManager.hubLink
    const sourceLinks = room.communeManager.sourceLinks

    // If there are transfer links, max out partMultiplier to their ability

    maxUpgradeStrength = 0

    if (hubLink && StructureUtils.isRCLActionable(hubLink)) {
      // Add a bit of extra range because of inherent limitations of withdrawing and transferring
      const range = Math.max(getRange(upgradeStructure.pos, hubLink.pos), 3)

      // Increase strength by throughput
      maxUpgradeStrength += findLinkThroughput(range) * 0.9
    }

    for (let i = 0; i < sourceLinks.length; i++) {
      const sourceLink = sourceLinks[i]

      if (!sourceLink) continue
      if (!StructureUtils.isRCLActionable(sourceLink)) continue

      const range = getRange(sourceLink.pos, upgradeStructure.pos)

      // Increase strength by throughput

      maxUpgradeStrength += findLinkThroughput(range, this.getEstimatedSourceIncome(room)[i]) * 0.7
    }

    data.maxUpgradeStrength = maxUpgradeStrength
    return maxUpgradeStrength
  }

  static getEstimatedSourceIncome(room: Room) {
    const data = communeData[room.name]
    if (data.estimatedCommuneSourceIncome !== undefined) return data.estimatedCommuneSourceIncome

    const sources = RoomOps.getSources(room)
    const estimatedIncome: number[] = []

    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i]

      let effect = source.effectsData.get(PWR_DISRUPT_SOURCE) as PowerEffect
      if (effect) continue

      let income = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME

      effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
      if (effect)
        income +=
          POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] /
          POWER_INFO[PWR_REGEN_SOURCE].period

      estimatedIncome[i] = income
    }

    data.estimatedCommuneSourceIncome = estimatedIncome
    return estimatedIncome
  }

  static canTakeNewWorkRequest(roomName: string) {
    if (Memory.rooms[roomName][RoomMemoryKeys.workRequest]) return false
    if (Game.rooms[roomName].energyCapacityAvailable < 650) return false

    const room = Game.rooms[roomName]
    if (!room.roomManager.structures.spawn.length) return false

    return true
  }

  /**
   * Find spawns that are inactive and active
   * Assign spawnIDs to creeps
   */
  static getOrganizedSpawns(
    room: Room,
    spawns: StructureSpawn[] = room.roomManager.structures.spawn,
  ): false | OrganizedSpawns {
    if (room.organizedSpawns !== undefined) return room.organizedSpawns
    // Find spawns that are and aren't spawning

    const inactiveSpawns: StructureSpawn[] = []
    const activeSpawns: StructureSpawn[] = []

    for (const spawn of spawns) {
      if (spawn.renewed) continue
      if (!StructureUtils.isRCLActionable(spawn)) continue

      if (spawn.spawning) {
        activeSpawns.push(spawn)
        continue
      }

      inactiveSpawns.push(spawn)
    }

    room.organizedSpawns = {
      activeSpawns,
      inactiveSpawns,
    }
    return room.organizedSpawns
  }

  /**
   * Wether the commune wants to be funneled for upgrading, independent of what other rooms want.
   * Assumes the room already meats the requirements to be a funnel target
   */
  static getUpgradeCapacity(room: Room) {
    const desiredStrength = this.getDesiredUpgraderStrength(room)
    const maxStrength = this.getMaxUpgradeStrength(room)
    // We do not have enough desire
    if (desiredStrength < maxStrength) return false

    // We have enough desired strength to register our room as fully funneled
    return maxStrength
  }

  static getResourceTargets(room: Room) {
    const data = communeData[room.name]
    if (data.resourceTargets !== undefined) return data.resourceTargets

    const resourceTargets: ResourceTargets = {
      min: {},
      max: {},
    }
    const storingStructuresCapacity = this.storingStructuresCapacity(room)
    let min: number

    resourceTargets.min[RESOURCE_BATTERY] = room.roomManager.factory
      ? storingStructuresCapacity * 0.005
      : 0
    resourceTargets.max[RESOURCE_BATTERY] = storingStructuresCapacity * 0.015

    min = resourceTargets.min[RESOURCE_ENERGY] =
      storingStructuresCapacity * 0.9 /* this.energyMinResourceTarget(storingStructuresCapacity) */
    resourceTargets.max[RESOURCE_ENERGY] = Math.max(
      storingStructuresCapacity * 0.5,
      this.minStoredEnergy(room),
      min,
    )

    // minerals

    resourceTargets.min[RESOURCE_HYDROGEN] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_HYDROGEN] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_OXYGEN] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_OXYGEN] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_UTRIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_UTRIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_KEANIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_KEANIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_LEMERGIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_LEMERGIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_ZYNTHIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_ZYNTHIUM] = storingStructuresCapacity * 0.027

    if (Game.shard.name === 'swc') {
      resourceTargets.min[RESOURCE_CATALYST] = storingStructuresCapacity * 0
      resourceTargets.max[RESOURCE_CATALYST] = storingStructuresCapacity * 0.01
    } else {
      resourceTargets.min[RESOURCE_CATALYST] = storingStructuresCapacity * 0.01
      resourceTargets.max[RESOURCE_CATALYST] = storingStructuresCapacity * 0.027
    }

    // Boosts

    resourceTargets.min[RESOURCE_UTRIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_UTRIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_UTRIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_UTRIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_KEANIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_KEANIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_KEANIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_KEANIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_LEMERGIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_LEMERGIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_LEMERGIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_LEMERGIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_ZYNTHIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_ZYNTHIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_ZYNTHIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_ZYNTHIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_GHODIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_GHODIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    // other raw

    resourceTargets.min[RESOURCE_POWER] = room.roomManager.powerSpawn
      ? storingStructuresCapacity * 0.002
      : 0
    resourceTargets.max[RESOURCE_POWER] = storingStructuresCapacity * 0.015

    resourceTargets.min[RESOURCE_OPS] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_OPS] = storingStructuresCapacity * 0.02

    resourceTargets.min[RESOURCE_METAL] = 0
    resourceTargets.max[RESOURCE_METAL] = 0

    resourceTargets.min[RESOURCE_BIOMASS] = 0
    resourceTargets.max[RESOURCE_BIOMASS] = 0

    resourceTargets.min[RESOURCE_SILICON] = 0
    resourceTargets.max[RESOURCE_SILICON] = 0

    resourceTargets.min[RESOURCE_MIST] = 0
    resourceTargets.max[RESOURCE_MIST] = 0

    // commodities
    // low level

    resourceTargets.min[RESOURCE_GHODIUM_MELT] = 0
    resourceTargets.max[RESOURCE_GHODIUM_MELT] = 0

    resourceTargets.min[RESOURCE_COMPOSITE] = 0
    resourceTargets.max[RESOURCE_COMPOSITE] = 0

    resourceTargets.min[RESOURCE_CRYSTAL] = 0
    resourceTargets.max[RESOURCE_CRYSTAL] = 0

    resourceTargets.min[RESOURCE_LIQUID] = 0
    resourceTargets.max[RESOURCE_LIQUID] = 0

    // tier 1 commodities

    resourceTargets.min[RESOURCE_ALLOY] = 0
    resourceTargets.max[RESOURCE_ALLOY] = 0

    resourceTargets.min[RESOURCE_CELL] = 0
    resourceTargets.max[RESOURCE_CELL] = 0

    resourceTargets.min[RESOURCE_WIRE] = 0
    resourceTargets.max[RESOURCE_WIRE] = 0

    resourceTargets.min[RESOURCE_CONDENSATE] = 0
    resourceTargets.max[RESOURCE_CONDENSATE] = 0

    // tier 2

    // tier 3

    // tier 4

    // tier 5

    data.resourceTargets = resourceTargets
    return resourceTargets
  }

  /**
   * The minimum amount of stored energy the room should only use in emergencies
   */
  static minStoredEnergy(room: Room) {
    const data = communeData[room.name]
    if (data.minStoredEnergy !== undefined) return data.minStoredEnergy

    // Consider the controller level to an exponent and this room's attack threat

    let minStoredEnergy =
      Math.pow(room.controller.level * 6000, 1.06) + room.memory[RoomMemoryKeys.threatened] * 20

    // If there is a next RCL, Take away some minimum based on how close we are to the next RCL

    const RClCost = room.controller.progressTotal
    if (RClCost) {
      minStoredEnergy -= Math.pow(
        (Math.min(room.controller.progress, RClCost) / RClCost) * 20,
        3.35,
      )
    }

    minStoredEnergy = Math.floor(minStoredEnergy)

    data.minStoredEnergy = minStoredEnergy
    return minStoredEnergy
  }

  static storedEnergyUpgradeThreshold(room: Room) {
    return Math.floor(this.minStoredEnergy(room) * 1.3)
  }

  static energyMinResourceTarget(room: Room, storingStructuresCapacity: number) {
    if (room.controller.level < 8) {
      const funnelOrder = CollectiveManager.getFunnelOrder()
      if (funnelOrder[0] === room.name) {
        return Math.min(
          this.storedEnergyUpgradeThreshold(room) * 1.2 + this.upgradeTargetDistance(room),
          storingStructuresCapacity / 2,
        )
      }
      return Math.min(this.storedEnergyUpgradeThreshold(room) * 1.2, storingStructuresCapacity / 2)
    }

    return this.minStoredEnergy(room)
  }

  static upgradeTargetDistance(room: Room) {
    return Math.min(
      room.controller.progressTotal - room.controller.progress,
      Game.gcl.progressTotal - Game.gcl.progress,
    )
  }

  /**
   * Presciption on if we should be trying to build remote contianers
   */
  static shouldRemoteContainers(room: Room) {
    return room.energyCapacityAvailable >= 650
  }

  static storingStructuresCapacity(room: Room) {
    if (room.storingStructuresCapacity !== undefined) return room.storingStructuresCapacity

    let capacity = 0
    if (room.storage && room.controller.level >= 4) capacity += room.storage.store.getCapacity()
    if (room.terminal && room.controller.level >= 6) capacity += room.terminal.store.getCapacity()

    room.storingStructuresCapacity = capacity
    return capacity
  }

  static storingStructures(room: Room) {
    if (room.storingStructures !== undefined) return room.storingStructures

    const storingStructures: (StructureStorage | StructureTerminal)[] = []

    if (room.storage && room.controller.level >= 4) storingStructures.push(room.storage)
    if (room.terminal && room.controller.level >= 6) storingStructures.push(room.terminal)

    room.storingStructures = storingStructures
    return storingStructures
  }
}
