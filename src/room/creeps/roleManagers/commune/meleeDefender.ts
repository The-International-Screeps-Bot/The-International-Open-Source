import { impassibleStructureTypes, customColors } from 'international/constants'
import {
    areCoordsEqual,
    customLog,
    findClosestObject,
    findClosestObjectEuc,
    findFurthestObjectEuc,
    findObjectWithID,
    getRange,
    getRangeEuc,
    getRangeOfCoords,
    randomTick,
    randomVal,
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

            room.usedRampartIDs.set(rampart.id, this.id)
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

    findRampart?() {
        const { room } = this

        if (this.memory.RID && !randomTick(10)) return findObjectWithID(this.memory.RID)

        const enemyAttackers = room.enemyAttackers

        let bestScore = Infinity
        let bestRampart: StructureRampart | undefined

        for (const rampart of room.defensiveRamparts) {
            if (rampart.hits < 3000) continue
            // Allow the creep to take rampart reservations from other defender types - but not its own type

            const creepIDUsingRampart = room.usedRampartIDs.get(rampart.id)
            if (creepIDUsingRampart) {
                const creepUsingRampart = findObjectWithID(creepIDUsingRampart)
                if (creepUsingRampart.role === 'meleeDefender') continue
            }

            if (room.findStructureAtCoord(rampart.pos, STRUCTURE_RAMPART)) continue

            let score = getRangeOfCoords(rampart.pos, findClosestObjectEuc(rampart.pos, enemyAttackers).pos)
            if (getRangeOfCoords(rampart.pos, this.pos) <= 1) score *= 0.5

            score += getRangeOfCoords(rampart.pos, room.anchor) * 0.01

            if (score >= bestScore) continue

            bestScore = score
            bestRampart = rampart
        }

        if (!bestRampart) return false

        const creepIDUsingRampart = room.usedRampartIDs.get(bestRampart.id)
        if (creepIDUsingRampart) {
            const creepUsingRampart = findObjectWithID(creepIDUsingRampart)
            delete creepUsingRampart.memory.RID
        }

        this.memory.RID = bestRampart.id
        room.usedRampartIDs.set(bestRampart.id, this.id)
        return bestRampart
    }

    defendWithRampart?() {
        const { room } = this

        const enemyCreeps = room.enemyAttackers

        const rampart = this.findRampart()
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

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: MeleeDefender = Game.creeps[creepName]

            if (creep.spawning) continue

            delete creep.memory.ROS

            creep.advancedDefend()
        }
    }
}
