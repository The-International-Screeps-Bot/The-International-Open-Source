import { impassibleStructureTypes, customColors } from 'international/constants'
import {
    areCoordsEqual,
    customLog,
    findClosestObject,
    findClosestObjectEuc,
    findObjectWithID,
    getRange,
    getRangeEuc,
    getRangeOfCoords,
    randomTick,
} from 'international/utils'
import { packCoord } from 'other/codec'

export class MeleeDefender extends Creep {
    preTickManager() {
        const { room } = this

        room.attackingDefenderIDs.add(this.id)

        for (const enemyCreep of this.room.unprotectedEnemyCreeps) {
            const range = getRangeOfCoords(this.pos, enemyCreep.pos)
            if (range > 1) continue

            const estimatedDamage = this.combatStrength.melee * enemyCreep.defenceStrength

            //

            const targetDamage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)
            if (!targetDamage) {
                room.defenderEnemyTargetsWithDamage.set(enemyCreep.id, enemyCreep.netTowerDamage + estimatedDamage)
            } else room.defenderEnemyTargetsWithDamage.set(enemyCreep.id, targetDamage + estimatedDamage)

            //

            if (!room.defenderEnemyTargetsWithDefender.get(enemyCreep.id)) {
                room.defenderEnemyTargetsWithDefender.set(enemyCreep.id, [this.id])
                continue
            } else room.defenderEnemyTargetsWithDefender.get(enemyCreep.id).push(this.id)
        }

        if (this.memory.RID) {
            const rampart = findObjectWithID(this.memory.RID)
            if (!rampart || rampart.hits < 3000) {
                delete this.memory.RID
                return
            }

            room.usedRampartIDs.add(rampart.id)
        }
    }

    advancedDefend?() {
        const { room } = this

        if (this.combatTarget) {
            this.room.targetVisual(this.pos, this.combatTarget.pos)
            this.attack(this.combatTarget)
        }

        // Get enemyAttackers in the room, informing false if there are none

        let enemyCreeps = room.enemyAttackers

        if (!enemyCreeps.length) {
            enemyCreeps = room.enemyAttackers

            if (!enemyCreeps.length) return
        }

        if (!room.enemyDamageThreat || room.controller.safeMode) {
            this.defendWithoutRamparts(enemyCreeps)
            return
        }

        this.defendWithRampart()
    }

    defendWithoutRamparts?(enemyCreeps: Creep[]) {
        // Get the closest enemyAttacker

        const enemyCreep = findClosestObject(this.pos, enemyCreeps)

        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, enemyCreep.pos, { color: customColors.green, opacity: 0.3 })

        // If out of range move to it

        if (getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyCreep.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        /* this.attack(enemyCreep) */

        if (enemyCreep.canMove) this.assignMoveRequest(enemyCreep.pos)
        return true
    }

    findRampart?(enemyCreep: Creep) {
        const { room } = this

        if (this.memory.RID && !randomTick(10)) return findObjectWithID(this.memory.RID)

        // Get the room's ramparts, filtering for those and informing false if there are none

        const ramparts = room.defensiveRamparts.filter(rampart => {
            // Allow the rampart the creep is currently standing on

            if (areCoordsEqual(this.pos, rampart.pos)) return true

            if (room.usedRampartIDs.has(rampart.id)) return false

            // Avoid ramparts that are low

            if (rampart.hits < 3000) return false

            if (room.coordHasStructureTypes(rampart.pos, new Set(impassibleStructureTypes))) return false

            // Inform wether there is a creep at the pos
            /*
            const packedCoord = packCoord(rampart.pos)

            if (room.creepPositions.get(packedCoord)) return false
            if (room.powerCreepPositions.get(packedCoord)) return false
 */
            return true
        })

        if (!ramparts.length) return false

        // Find the closest rampart to the enemyAttacker

        const rampart = findClosestObjectEuc(enemyCreep.pos, ramparts)

        this.memory.RID = rampart.id
        room.usedRampartIDs.add(rampart.id)
        return rampart
    }

    defendWithRampart?() {
        const { room } = this

        const enemyCreeps = room.enemyAttackers

        // Get the closest enemyAttacker

        const enemyCreep = this.pos.findClosestByPath(enemyCreeps, {
            ignoreCreeps: true,
            ignoreRoads: true,
        })

        const rampart = this.findRampart(enemyCreep)
        if (!rampart) return this.defendWithoutRamparts(enemyCreeps)

        this.memory.ROS = true

        // Attack the enemyAttacker

        /* this.attack(enemyCreep) */

        // Visualize the targeting, if roomVisuals are enabled

        if (Memory.roomVisuals) {
            /*
            for (const rampart of ramparts)
                room.visual.text(
                    getRangeEuc(enemyCreep.pos.x, rampart.pos.x, enemyCreep.pos.y, rampart.pos.y).toString(),
                    rampart.pos,
                    { font: 0.5 },
                )
 */

            this.room.visual.line(this.pos.x, this.pos.y, rampart.pos.x, rampart.pos.y, { color: customColors.yellow })

            this.room.targetVisual(this.pos, enemyCreep.pos)

            room.visual.circle(enemyCreep.pos, { fill: customColors.green })
        }

        // If the creep is range 0 to the closestRampart, inform false

        if (getRange(this.pos.x, rampart.pos.x, this.pos.y, rampart.pos.y) === 0) return false

        // Otherwise move to the rampart preffering ramparts and inform true

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: rampart.pos, range: 0 }],
            weightStructures: {
                road: 5,
                rampart: 1,
            },
            plainCost: 40,
            swampCost: 100,
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

            delete creep.memory.ROS

            creep.advancedDefend()
        }
    }
}
