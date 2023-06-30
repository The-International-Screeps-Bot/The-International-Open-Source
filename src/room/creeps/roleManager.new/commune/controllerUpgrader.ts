import { RoomMemoryKeys, packedPosLength } from 'international/constants'

export class ControllerUpgraderManager {

    role: CreepRoles = 'controllerUpgrader'
    // Allows for the pattern: instance.manager.run(instance)
    manager = this

    isDying(creep: Creep) {
        // Stop if creep is spawning

        if (creep.spawning) return false

        // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

        if (
            creep.ticksToLive >
            creep.body.length * CREEP_SPAWN_TIME + creep.room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength
        )
            return false

        // Record creep as isDying

        return true
    }

    shouldBuild(creep: Creep) {
        return creep.room.roomManager.cSiteTarget;
    }

    initialRun(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {
            this.initialRunCreep(Game.creeps[creepName])
        }
    }

    private initialRunCreep(creep: Creep) {
        creep.room.upgradeStrength += creep.upgradeStrength
    }

    run(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {
            this.runCreep(Game.creeps[creepName])
        }
    }

    private runCreep(creep: Creep) {
        if (this.shouldBuild(creep)) {
            creep.advancedBuild();
            return;
        }
        creep.advancedUpgradeController()
    }
}

export const controllerUpgraderManager = new ControllerUpgraderManager()
