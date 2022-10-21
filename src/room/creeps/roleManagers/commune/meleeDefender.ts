import { impassibleStructureTypes, myColors } from 'international/constants'
import { areCoordsEqual, findClosestObject, findClosestObjectEuc, getRange, getRangeEuc } from 'international/utils'
import { packCoord } from 'other/packrat'

export class MeleeDefender extends Creep {
    advancedDefend?() {
        const { room } = this

        // Get enemyAttackers in the room, informing false if there are none

        let enemyCreeps = room.enemyAttackers.filter(function (enemyAttacker) {
            return !enemyAttacker.isOnExit
        })

        if (!enemyCreeps.length) {
            enemyCreeps = room.enemyAttackers.filter(function (enemyAttacker) {
                return !enemyAttacker.isOnExit
            })

            if (!enemyCreeps.length) return
        }

        if (!room.enemyDamageThreat) {
            this.defendWithoutRamparts(enemyCreeps)
            return
        }

        this.defendWithRampart(enemyCreeps)
    }

    defendWithoutRamparts?(enemyCreeps: Creep[]) {
        // Get the closest enemyAttacker

        const enemyCreep = findClosestObject(this.pos, enemyCreeps)

        if (Memory.roomVisuals) this.room.visual.line(this.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

        // If the range is more than 1

        if (getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y) > 1) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyCreep.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        this.attack(enemyCreep)

        if (enemyCreep.canMove) this.assignMoveRequest(enemyCreep.pos)
        return true
    }

    defendWithRampart?(enemyCreeps: Creep[]) {
        const { room } = this

        // Get the closest enemyAttacker

        const enemyCreep = this.pos.findClosestByPath(enemyCreeps, {
            ignoreCreeps: true,
            ignoreRoads: true,
        })

        // Get the room's ramparts, filtering for those and informing false if there are none

        const ramparts = room.defensiveRamparts.filter(rampart => {
            // Avoid ramparts that are low

            if (rampart.hits < 3000) return false

            // Allow the rampart the creep is currently standing on

            if (areCoordsEqual(this.pos, rampart.pos)) return true

            if (room.coordHasStructureTypes(rampart.pos, new Set(impassibleStructureTypes))) return false

            // Inform wether there is a creep at the pos

            const packedCoord = packCoord(rampart.pos)
            return (!room.creepPositions.get(packedCoord) || !room.powerCreepPositions.get(packedCoord))
        })

        if (!ramparts.length) {
            return this.defendWithoutRamparts(enemyCreeps)
        }

        this.memory.ROS = true

        // Attack the enemyAttacker

        this.attack(enemyCreep)

        // Find the closest rampart to the enemyAttacker

        for (const rampart of ramparts)
            room.visual.text(
                getRangeEuc(enemyCreep.pos.x, rampart.pos.x, enemyCreep.pos.y, rampart.pos.y).toString(),
                rampart.pos,
                { font: 0.5 },
            )

        const closestRampart = findClosestObjectEuc(enemyCreep.pos, ramparts)

        room.visual.circle(enemyCreep.pos, { fill: myColors.yellow })
        room.visual.circle(closestRampart.pos, { fill: myColors.red })
        // Visualize the targeting, if roomVisuals are enabled

        if (Memory.roomVisuals)
            room.visual.line(this.pos, closestRampart.pos, {
                color: myColors.lightBlue,
                opacity: 0.2,
            })

        // If the creep is range 0 to the closestRampart, inform false

        if (getRange(this.pos.x, closestRampart.pos.x, this.pos.y, closestRampart.pos.y) === 0) return false

        // Otherwise move to the rampart preffering ramparts and inform true

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: closestRampart.pos, range: 0 }],
            weightStructures: {
                road: 10,
                rampart: 1,
            },
            plainCost: 20,
            swampCost: 80,
        })

        return true
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static meleeDefenderManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: MeleeDefender = Game.creeps[creepName]

            if (creep.spawning) continue

            creep.advancedDefend()
        }
    }
}
