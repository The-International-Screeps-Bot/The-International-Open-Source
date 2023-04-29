import { updateStat } from 'international/statsManager'
import { CommuneManager } from './commune'
import { customLog } from 'international/utils'
import { internationalManager } from 'international/international'

export class PowerSpawningStructuresManager {
    communeManager: CommuneManager
    powerSpawn: StructurePowerSpawn

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        this.powerSpawn = this.communeManager.room.powerSpawn
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

        if (result === OK) updateStat(this.powerSpawn.room.name, 'eop', POWER_SPAWN_ENERGY_RATIO)
    }

    /**
     * Find unspawned power creeps and spawn them
     */
    private advancedSpawn() {
        for (let i = internationalManager.unspawnedPowerCreepNames.length - 1; i >= 0; i--) {
            const creep = Game.powerCreeps[internationalManager.unspawnedPowerCreepNames[i]]

            creep.spawn(this.powerSpawn)
            internationalManager.unspawnedPowerCreepNames.pop()
            return
        }
    }
}
