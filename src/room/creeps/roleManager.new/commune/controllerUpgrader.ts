import { RoomMemoryKeys, creepRoles, packedPosLength } from 'international/constants'
import { DefaultRoleManager } from 'room/creeps/defaultRoleManager'

class ControllerUpgraderManager extends DefaultRoleManager {
    role: CreepRoles = 'controllerUpgrader'
    // Allows for the pattern: instance.manager.run(instance)
    manager = this

    isDying(creep: Creep) {
        // Stop if creep is spawning

        if (creep.spawning) return false

        // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

        if (
            creep.ticksToLive >
            creep.body.length * CREEP_SPAWN_TIME +
                creep.room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength
        )
            return false

        // Record creep as isDying

        return true
    }
    /*
// Not good enough, we need to account for downgrading; state machine
    shouldBuild(creep: Creep) {
        return !!creep.room.roomManager.cSiteTarget;
    }
 */

    runUpdate(room: Room) {
        for (const creepName of room.myCreeps[this.role]) {
            this.initialRunCreep(Game.creeps[creepName])
        }
    }

    runUpdateCreep(creep: Creep) {
        creep.room.communeManager.upgradeStrength += creep.room.communeManager.upgradeStrength
    }

    runInitial(room: Room) {
        for (const creepName of room.myCreeps[this.role]) {
            this.initialRunCreep(Game.creeps[creepName])
        }
    }

    initialRunCreep(creep: Creep) {

    }

    run(room: Room) {
        for (const creepName of room.myCreeps[this.role]) {
            this.runCreep(Game.creeps[creepName])
        }
    }

    runCreep(creep: Creep) {
        /*         if (this.shouldBuild(creep)) {
            creep.advancedBuild();
            return;
        } */
        creep.advancedUpgradeController()
    }
}

export const controllerUpgraderManager = new ControllerUpgraderManager()
