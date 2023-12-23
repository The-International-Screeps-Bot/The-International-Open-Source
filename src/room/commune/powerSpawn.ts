import { statsManager } from 'international/statsManager'
import { CommuneManager } from './commune'
import { customLog } from 'utils/logging'
import { collectiveManager } from 'international/collective'
import { RoomLogisticsRequestTypes } from 'international/constants'
import { scalePriority } from 'utils/utils'

export class PowerSpawnsManager {
    communeManager: CommuneManager
    powerSpawn: StructurePowerSpawn

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        this.powerSpawn = this.communeManager.room.roomManager.powerSpawn
        if (!this.powerSpawn) return

        this.advancedProcessPower()
        this.advancedSpawn()
    }

    /**
     * So long as there are sufficient resources, try to process power
     */
    private advancedProcessPower() {
        if (this.powerSpawn.store.getCapacity(RESOURCE_ENERGY) < POWER_SPAWN_ENERGY_RATIO) return
        if (!this.powerSpawn.store.getCapacity(RESOURCE_POWER)) return

        const result = this.powerSpawn.processPower()

        if (result === OK)
            statsManager.updateStat(this.powerSpawn.room.name, 'eop', POWER_SPAWN_ENERGY_RATIO)
    }

    /**
     * Find unspawned power creeps and spawn them
     */
    private advancedSpawn() {
        for (let i = collectiveManager.unspawnedPowerCreepNames.length - 1; i >= 0; i--) {
            const creep = Game.powerCreeps[collectiveManager.unspawnedPowerCreepNames[i]]

            creep.spawn(this.powerSpawn)
            collectiveManager.unspawnedPowerCreepNames.pop()
            return
        }
    }

    private createRoomLogisticsRequests() {

        // Make sure we have a reasonable amount of energy and power

        const resourcesInStoringStructures = this.communeManager.room.roomManager.resourcesInStoringStructures

        // Make sure we have a reasonable amount of power to process
        if (
            resourcesInStoringStructures.power <
            this.powerSpawn.store.getCapacity(RESOURCE_POWER)
        )
            return
        // Make sure we have enough energy -- don't process power if our economy is struggling or reovering
        if (
            resourcesInStoringStructures.energy <
            this.communeManager.minStoredEnergy
        )
            return

        // energy

        this.communeManager.room.createRoomLogisticsRequest({
            target: this.powerSpawn,
            /* onlyFull: true, */
            type: RoomLogisticsRequestTypes.offer,
            priority: scalePriority(
                this.powerSpawn.store.getCapacity(RESOURCE_ENERGY),
                this.powerSpawn.usedReserveStore,
                10,
                true,
            ),
        })

        // fulfill power if less than half

        if (this.powerSpawn.reserveStore[RESOURCE_POWER] < this.powerSpawn.store.getCapacity(RESOURCE_POWER) * 0.5) {

            this.communeManager.room.createRoomLogisticsRequest({
                target: this.powerSpawn,
                /* onlyFull: true, */
                type: RoomLogisticsRequestTypes.offer,
                priority: scalePriority(
                    this.powerSpawn.store.getCapacity(RESOURCE_ENERGY),
                    this.powerSpawn.usedReserveStore,
                    10,
                    true,
                ),
            })
        }
    }
}
