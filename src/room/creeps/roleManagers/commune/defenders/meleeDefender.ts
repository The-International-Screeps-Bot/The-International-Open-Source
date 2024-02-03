import {
  impassibleStructureTypes,
  customColors,
  CreepMemoryKeys,
  PlayerMemoryKeys,
  ReservedCoordTypes,
  FlagNames,
} from '../../../../../constants/general'
import { PlayerManager } from 'international/players'
import {
  areCoordsEqual,
  findClosestObject,
  findClosestObjectEuc,
  findFurthestObjectEuc,
  findObjectWithID,
  getRangeXY,
  getRangeEucXY,
  getRange,
  randomTick,
  randomVal,
  getRangeEuc,
} from 'utils/utils'
import { packCoord } from 'other/codec'

export class MeleeDefender extends Creep {
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
            if (range > 1) continue

            const estimatedDamage = this.combatStrength.melee * enemyCreep.defenceStrength

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

        if (this.combatTarget) {
            this.room.targetVisual(this.pos, this.combatTarget.pos)
            this.attack(this.combatTarget)
        }

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

    defendWithoutRamparts?(enemyCreeps: Creep[]) {
        // Get the closest enemyAttacker

        const enemyCreep =
            findClosestObject(this.pos, enemyCreeps) ||
            findClosestObject(this.pos, this.room.roomManager.notMyCreeps.enemy)

        if (Game.flags[FlagNames.roomVisuals])
          this.room.visual.line(this.pos, enemyCreep.pos, {
            color: customColors.green,
            opacity: 0.3,
          })

        // If out of range move to it

        if (getRange(this.pos, enemyCreep.pos) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyCreep.pos, range: 1 }],
            })

            return true
        }

        // Try to follow the enemy

        if (enemyCreep.canMove && !enemyCreep.isOnExit) this.assignMoveRequest(enemyCreep.pos)
        return true
    }

    findRampart?() {
        const { room } = this

        const creepMemory = Memory.creeps[this.name]

        if (creepMemory[CreepMemoryKeys.rampartTarget] && !randomTick(10))
            return findObjectWithID(creepMemory[CreepMemoryKeys.rampartTarget])

        const currentRampart = findObjectWithID(creepMemory[CreepMemoryKeys.rampartTarget])

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

            let score = getRangeEuc(rampart.pos, closestAttacker.pos)
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

        creepMemory[CreepMemoryKeys.rampartTarget] = bestRampart.id
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

        if (Game.flags[FlagNames.roomVisuals]) {
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

        if (getRange(this.pos, rampart.pos) === 0) return false

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

            delete creep.memory[CreepMemoryKeys.rampartOnlyShoving]

            creep.advancedDefend()
        }
    }
}
