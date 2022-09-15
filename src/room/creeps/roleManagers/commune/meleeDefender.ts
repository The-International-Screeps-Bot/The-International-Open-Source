import { impassibleStructureTypes, myColors } from 'international/constants'
import {
    areCoordsEqual,
    findClosestObject,
    findClosestObjectEuc,
    getRange,
    getRangeEuc,
    pack,
} from 'international/generalFunctions'

export class MeleeDefender extends Creep {
    advancedDefend?(): boolean {
        const { room } = this

        // Get enemyAttackers in the room, informing false if there are none

        const enemyAttackers = room.enemyAttackers.filter(function (enemyAttacker) {
            return !enemyAttacker.isOnExit()
        })

        if (!enemyAttackers.length) return false

        // Get the closest enemyAttacker

        const enemyAttacker = this.pos.findClosestByPath(enemyAttackers, {
            ignoreCreeps: true,
            ignoreRoads: true,
        })

        // Get the room's ramparts, filtering for those and informing false if there are none

        const ramparts = room.structures.rampart.filter(rampart => {
            // Allow the rampart the creep is currently standing on

            if (areCoordsEqual(this.pos, rampart.pos)) return true

            const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, rampart.pos)

            // Loop through each structure
            // If the structure is impassible, inform false

            for (const structure of structuresAtPos)
                if (impassibleStructureTypes.includes(structure.structureType)) return false

            // Inform wether there is a creep at the pos

            return !room.creepPositions.get(pack(rampart.pos))
        })

        if (!ramparts.length) {
            delete this.memory.ROS

            if (getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y) > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                })

                return true
            }

            this.attack(enemyAttacker)

            if (enemyAttacker.getActiveBodyparts(MOVE) > 0) this.moveRequest = pack(enemyAttacker.pos)
            return true
        }

        this.memory.ROS = true

        // Attack the enemyAttacker

        this.attack(enemyAttacker)

        // Find the closest rampart to the enemyAttacker

        for (const rampart of ramparts)
            room.visual.text(
                getRangeEuc(enemyAttacker.pos.x, rampart.pos.x, enemyAttacker.pos.y, rampart.pos.y).toString(),
                rampart.pos,
                { font: 0.5 },
            )

        const closestRampart = findClosestObjectEuc(enemyAttacker.pos, ramparts)

        room.visual.circle(enemyAttacker.pos, { fill: myColors.yellow })
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
