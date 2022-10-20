import { CommuneManager } from "./communeManager"

export class PowerSpawnManager {
    communeManager: CommuneManager
    powerSpawn: StructurePowerSpawn

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {

        this.powerSpawn = this.communeManager.room.powerSpawn
        if (!this.powerSpawn) return

        this.process()
    }
    private process() {

        if (!this.powerSpawn.store.getCapacity(RESOURCE_ENERGY)) return
        if (!this.powerSpawn.store.getCapacity(RESOURCE_POWER)) return

        this.powerSpawn.processPower()
    }
}
