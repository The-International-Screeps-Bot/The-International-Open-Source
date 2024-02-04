import {
    impassibleStructureTypes,
    customColors,
    rangedMassAttackMultiplierByRange,
    CreepMemoryKeys,
    ReservedCoordTypes,
} from '../../../../../constants/general'
import {
    areCoordsEqual,
    findClosestObject,
    findClosestObjectEuc,
    findObjectWithID,
    getRangeXY,
    getRangeEucXY,
    getRange,
    randomTick,
} from 'utils/utils'
import { packCoord } from 'other/codec'

export class RangedDefender extends Creep {
    update() {
        const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
        if (packedCoord) {
            this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.necessary)
        }
    }

    initRun() {
        if (this.spawning) return

        const { room } = this

        room.attackingDefenderIDs.add(this.id)

        for (const enemyCreep of this.room.roomManager.unprotectedEnemyCreeps) {
            const range = getRange(this.pos, enemyCreep.pos)
            if (range > 3) continue

            const estimatedDamage = this.combatStrength.ranged * enemyCreep.defenceStrength

            //

            const targetDamage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)
            if (!targetDamage) {
                room.defenderEnemyTargetsWithDamage.set(
                    enemyCreep.id,
                    enemyCreep.netTowerDamage + estimatedDamage,
                )
            } else
                room.defenderEnemyTargetsWithDamage.set(
                    enemyCreep.id,
                    targetDamage + estimatedDamage,
                )

            //

            if (!room.defenderEnemyTargetsWithDefender.get(enemyCreep.id)) {
                room.defenderEnemyTargetsWithDefender.set(enemyCreep.id, [this.id])
                continue
            } else room.defenderEnemyTargetsWithDefender.get(enemyCreep.id).push(this.id)
        }

        if (this.memory[CreepMemoryKeys.rampartTarget]) {
            const rampart = findObjectWithID(this.memory[CreepMemoryKeys.rampartTarget])
            if (!rampart || rampart.hits < 3000) {
                delete this.memory[CreepMemoryKeys.rampartTarget]
                return
            }

            room.usedRampartIDs.set(rampart.id, this.id)
        }
    }

    advancedDefend?() {
        const { room } = this

        this.advancedRangedAttack()

        // Get enemyAttackers in the room, informing false if there are none

        let enemyCreeps = room.roomManager.enemyAttackers

        if (!enemyCreeps.length) {
            enemyCreeps = room.roomManager.notMyCreeps.enemy

            if (!enemyCreeps.length) return

            this.defendWithoutRamparts(enemyCreeps)
            return
        }

        if (!room.roomManager.enemyDamageThreat || room.controller.safeMode) {
            this.defendWithoutRamparts(enemyCreeps)
            return
        }

        this.defendWithRampart()
    }

    advancedRangedAttack?() {
        if (!this.combatTarget) return
        this.room.targetVisual(this.pos, this.combatTarget.pos)

        if (
            !this.room.communeManager.towerAttackTarget ||
            this.combatTarget.id !== this.room.communeManager.towerAttackTarget.id
        ) {
            let massDamage = 0
            for (const enemyCreep of this.room.roomManager.enemyAttackers) {
                const range = getRange(this.pos, enemyCreep.pos)
                if (range > 3) continue

                massDamage +=
                    RANGED_ATTACK_POWER *
                    rangedMassAttackMultiplierByRange[range] *
                    enemyCreep.defenceStrength
            }

            if (massDamage >= RANGED_ATTACK_POWER) this.rangedMassAttack()
            else this.rangedAttack(this.combatTarget)
        }

        if (getRange(this.pos, this.combatTarget.pos) <= 1) this.rangedMassAttack()
        else this.rangedAttack(this.combatTarget)
    }

    defendWithoutRamparts?(enemyCreeps: Creep[]) {
        // Get the closest enemyAttacker

        const enemyCreep =
            findClosestObject(this.pos, enemyCreeps) ||
            findClosestObject(this.pos, this.room.roomManager.notMyCreeps.enemy)

        if (global.settings.roomVisuals)
            this.room.visual.line(this.pos, enemyCreep.pos, {
                color: customColors.green,
                opacity: 0.3,
            })

        // If out of range, move to

        if (getRange(this.pos, enemyCreep.pos) > 2) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyCreep.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        /* this.attack(enemyCreep) */

        return true
    }

    findRampart?() {
        const { room } = this

        if (this.memory[CreepMemoryKeys.rampartTarget] && !randomTick(10))
            return findObjectWithID(this.memory[CreepMemoryKeys.rampartTarget])

        const currentRampart = findObjectWithID(this.memory[CreepMemoryKeys.rampartTarget])
        const enemyAttackers = room.roomManager.enemyAttackers

        let bestScore = Infinity
        let bestRampart: StructureRampart | undefined

        for (const rampart of room.communeManager.defensiveRamparts) {
            if (rampart.hits < 3000) continue
            // Allow the creep to take rampart reservations from weaker defenders

            const creepIDUsingRampart = room.usedRampartIDs.get(rampart.id)
            if (creepIDUsingRampart && this.id !== creepIDUsingRampart) {
                const creepUsingRampart = findObjectWithID(creepIDUsingRampart)
                if (
                    creepUsingRampart.combatStrength.melee +
                        creepUsingRampart.combatStrength.ranged >=
                    this.combatStrength.melee + this.combatStrength.ranged
                )
                    continue
            }

            const closestAttacker = findClosestObjectEuc(rampart.pos, enemyAttackers)

            let score = getRangeEucXY(
                rampart.pos.x,
                closestAttacker.pos.x,
                rampart.pos.y,
                closestAttacker.pos.y,
            )
            if (currentRampart && getRange(rampart.pos, currentRampart.pos) <= 1) score *= 0.5

            score += getRange(rampart.pos, room.roomManager.anchor || { x: 25, y: 25 }) * 0.01

            if (score >= bestScore) continue

            bestScore = score
            bestRampart = rampart
        }

        if (!bestRampart) return false

        const creepIDUsingRampart = room.usedRampartIDs.get(bestRampart.id)
        if (creepIDUsingRampart) {
            const creepUsingRampart = findObjectWithID(creepIDUsingRampart)
            delete creepUsingRampart.memory[CreepMemoryKeys.rampartTarget]
        }
        this.memory[CreepMemoryKeys.rampartTarget] = bestRampart.id
        room.usedRampartIDs.set(bestRampart.id, this.id)
        return bestRampart
    }

    defendWithRampart?() {
        const { room } = this

        const enemyCreeps = room.roomManager.enemyAttackers

        const rampart = this.findRampart()
        if (!rampart) return this.defendWithoutRamparts(enemyCreeps)

        this.memory[CreepMemoryKeys.rampartOnlyShoving] = true

        // Attack the enemyAttacker

        /* this.attack(enemyCreep) */

        // Visualize the targeting, if roomVisuals are enabled

        if (global.settings.roomVisuals) {
            /*
            for (const rampart of ramparts)
                room.visual.text(
                    getRangeEucXY(enemyCreep.pos.x, rampart.pos.x, enemyCreep.pos.y, rampart.pos.y).toString(),
                    rampart.pos,
                    { font: 0.5 },
                )
 */

            this.room.visual.line(this.pos.x, this.pos.y, rampart.pos.x, rampart.pos.y, {
                color: customColors.yellow,
            })
        }

        // If the creep is range 0 to the closestRampart, inform false

        if (getRangeXY(this.pos.x, rampart.pos.x, this.pos.y, rampart.pos.y) === 0) return false

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
            const creep: RangedDefender = Game.creeps[creepName]

            if (creep.spawning) continue

            delete creep.memory[CreepMemoryKeys.rampartOnlyShoving]

            creep.advancedDefend()
        }
    }
}
