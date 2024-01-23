import { CollectiveManager } from 'international/collective'
import { RoomLogisticsRequestTypes } from 'international/constants'
import { StatsManager } from 'international/stats'
import { scalePriority } from 'utils/utils'

export class PowerSpawnProcs {
  static run(room: Room) {
    const powerSpawn = room.roomManager.powerSpawn
    if (!powerSpawn) return

    this.advancedProcessPower(powerSpawn)
    this.advancedSpawn(powerSpawn)
  }

  /**
   * So long as there are sufficient resources, try to process power
   */
  private static advancedProcessPower(powerSpawn: StructurePowerSpawn) {
    if (powerSpawn.store.getCapacity(RESOURCE_ENERGY) < POWER_SPAWN_ENERGY_RATIO) return
    if (!powerSpawn.store.getCapacity(RESOURCE_POWER)) return

    const result = powerSpawn.processPower()

    if (result === OK)
      StatsManager.updateStat(powerSpawn.room.name, 'eop', POWER_SPAWN_ENERGY_RATIO)
  }

  /**
   * Find unspawned power creeps and spawn them
   */
  private static advancedSpawn(powerSpawn: StructurePowerSpawn) {
    for (let i = CollectiveManager.unspawnedPowerCreepNames.length - 1; i >= 0; i--) {
      const creep = Game.powerCreeps[CollectiveManager.unspawnedPowerCreepNames[i]]

      creep.spawn(powerSpawn)
      CollectiveManager.unspawnedPowerCreepNames.pop()
      return
    }
  }

  private static createRoomLogisticsRequests(room: Room, powerSpawn: StructurePowerSpawn) {
    // Make sure we have a reasonable amount of energy and power

    const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures

    // Make sure we have a reasonable amount of power to process
    if (resourcesInStoringStructures.power < powerSpawn.store.getCapacity(RESOURCE_POWER)) return
    // Make sure we have enough energy -- don't process power if our economy is struggling or reovering
    if (resourcesInStoringStructures.energy < room.communeManager.minStoredEnergy) return

    // energy

    room.createRoomLogisticsRequest({
      target: powerSpawn,
      /* onlyFull: true, */
      type: RoomLogisticsRequestTypes.offer,
      priority: scalePriority(
        powerSpawn.store.getCapacity(RESOURCE_ENERGY),
        powerSpawn.usedReserveStore,
        10,
        true,
      ),
    })

    // fulfill power if less than half

    if (
      powerSpawn.reserveStore[RESOURCE_POWER] <
      powerSpawn.store.getCapacity(RESOURCE_POWER) * 0.5
    ) {
      room.createRoomLogisticsRequest({
        target: powerSpawn,
        /* onlyFull: true, */
        type: RoomLogisticsRequestTypes.offer,
        priority: scalePriority(
          powerSpawn.store.getCapacity(RESOURCE_ENERGY),
          powerSpawn.usedReserveStore,
          10,
          true,
        ),
      })
    }
  }
}
