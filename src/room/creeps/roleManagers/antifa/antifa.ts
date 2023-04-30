import { CombatRequestKeys, CreepMemoryKeys, antifaRoles, customColors, squadQuotas } from 'international/constants'
import { customLog, findClosestObject, getRangeXY, isCoordExit, isXYExit } from 'international/utils'
import { internationalManager } from 'international/international'
import { Duo } from './duo'
import { Quad } from './quad'

export class Antifa extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (internationalManager.creepsByCombatRequest[this.memory[CreepMemoryKeys.combatRequest]])
            internationalManager.creepsByCombatRequest[this.memory[CreepMemoryKeys.combatRequest]][this.role].push(
                this.name,
            )

        // We don't want a squad or we already have done

        if (!this.memory[CreepMemoryKeys.squadSize]) return
        if (this.memory[CreepMemoryKeys.isSquadFormed]) return

        // Tell others we want a squad

        /*
        const memberNames = [this.name]

        if (this.memory[CreepMemoryKeys.squadMembers]) {
            for (let i = 0; i < this.memory[CreepMemoryKeys.squadMembers].length; i++) {
                const memberName = this.memory[CreepMemoryKeys.squadMembers][i]

                if (!Game.creeps[memberName]) {
                    this.memory[CreepMemoryKeys.squadMembers].splice(i, 1)
                    break
                }

                memberNames.push(memberName)
            }

            if (this.memory[CreepMemoryKeys.squadMembers].length === this.memory[CreepMemoryKeys.squadSize]) {
                for (const memberName of memberNames) {
                    const memberMemory = Memory.creeps[memberName]
                    memberMemory[CreepMemoryKeys.isSquadFormed] = true
                    memberMemory[CreepMemoryKeys.squadMembers] = memberNames
                }

                if (this.memory[CreepMemoryKeys.squadSize] === 2) {
                    this.squad = new Duo(memberNames)
                    return
                }

                this.squad = new Quad(memberNames)
                return
            }
        }
 */
        // The creep didn't have enough members to form a squad, so make a request

        this.memory[CreepMemoryKeys.squadMembers] = [this.name]
        this.room.squadRequests.add(this.name)
    }

    runSquad?() {

        const creepMemory = Memory.creeps[this.name]

        // The creep should be single

        if (!creepMemory[CreepMemoryKeys.squadSize]) return false
        if (creepMemory[CreepMemoryKeys.isSquadFormed] && creepMemory[CreepMemoryKeys.squadMembers].length === 1)
            return false
        if (!squadQuotas[creepMemory[CreepMemoryKeys.squadType]][this.role]) return false


        // The squad has already been run

        if (this.squadRan) return true

        if (!this.findSquad()) {
            const request = Memory.combatRequests[creepMemory[CreepMemoryKeys.combatRequest]]
            if (request && request[CombatRequestKeys.responder] === this.room.name) this.activeRenew()
            return true
        }

        this.squad.run()
        return true
    }

    /**
     * Tries to find a squad, creating one if none could be found
     */
    findSquad?() {
        if (this.squad) return true

        const creepMemory = Memory.creeps[this.name]
        if (creepMemory[CreepMemoryKeys.isSquadFormed]) {
            const memberNames: string[] = []

            // Filter out dead members

            for (const memberName of creepMemory[CreepMemoryKeys.squadMembers]) {
                if (!Game.creeps[memberName]) continue

                memberNames.push(memberName)
            }

            // Update member list in case there was a change

            for (const memberName of memberNames) {
                Memory.creeps[memberName][CreepMemoryKeys.squadMembers] = memberNames
            }

            // Don't try to make a squad if we have one member

            if (memberNames.length === 1) return false

            this.createSquad(memberNames)
            return true
        }

        const squadQuota: Partial<{[key in CreepRoles]: number }> = squadQuotas[creepMemory[CreepMemoryKeys.squadType]][this.role]
        squadQuota[this.role] -= 1

        // The squad is not yet formed

        for (const requestingCreepName of this.room.squadRequests) {
            if (Game.creeps[requestingCreepName].spawning) continue
            if (requestingCreepName === this.name) continue

            const requestingCreep = Game.creeps[requestingCreepName]

            // All members must be trying to make the same type of squad

            if (
                creepMemory[CreepMemoryKeys.squadCombatType] !== Memory.creeps[requestingCreep.name][CreepMemoryKeys.squadCombatType]
            )
                continue

            if (!squadQuota[requestingCreep.role]) continue

            creepMemory[CreepMemoryKeys.squadMembers].push(requestingCreepName)

            // We've found enough members

            if (creepMemory[CreepMemoryKeys.squadMembers].length === creepMemory[CreepMemoryKeys.squadSize]) break

            squadQuota[requestingCreep.role] -= 1
        }

        // We weren't able to find enough members to form the squad we wanted

        if (creepMemory[CreepMemoryKeys.squadMembers].length !== creepMemory[CreepMemoryKeys.squadSize]) return false

        const memberNames: string[] = []

        for (const memberName of creepMemory[CreepMemoryKeys.squadMembers]) {
            // We don't need others to think we need a squad when we have one now

            this.room.squadRequests.delete(memberName)

            // Tell each member important squad info so each can take over as leader

            const memberMemory = Memory.creeps[memberName]
            memberMemory[CreepMemoryKeys.squadMembers] = creepMemory[CreepMemoryKeys.squadMembers]
            memberMemory[CreepMemoryKeys.isSquadFormed] = true

            memberNames.push(memberName)
        }

        this.createSquad(memberNames)
        return true
    }

    createSquad?(memberNames: string[]) {
        if (this.memory[CreepMemoryKeys.squadMembers].length === 2) {
            this.squad = new Duo(memberNames)
            return
        }

        this.squad = new Quad(memberNames)
        return
    }

    runSingle?() {
        const { room } = this
        this.message = 'S'
        // In attackTarget

        if (this.memory[CreepMemoryKeys.combatRequest] === room.name) {
            if (this.runCombat()) return

            this.stompEnemyCSites()
            return
        }

        this.passiveRangedAttack()
        this.passiveHeal()

        // In the commune

        if (this.commune.name === this.name) {
            // Go to the attackTarget

            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.combatRequest]),
                        range: 25,
                    },
                ],
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                },
            })
            return
        }

        // In a non-attackTarget or commune room

        // Go to the attackTarget

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.combatRequest]),
                    range: 25,
                },
            ],
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
            },
        })
    }

    runCombat?() {
        if (this.role === 'antifaRangedAttacker') return this.advancedRangedAttack()
        if (this.role === 'antifaAttacker') return this.advancedAttack()
        return this.advancedDismantle()
    }

    advancedRangedAttack?() {
        const { room } = this

        let enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit
        })

        if (!enemyAttackers.length) enemyAttackers = room.enemyAttackers

        // If there are none

        if (!enemyAttackers.length) {
            let enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit
            })

            if (!enemyCreeps.length) enemyCreeps = room.enemyCreeps

            if (!enemyCreeps.length) {
                if (this.aggressiveHeal()) return true
                return this.rangedAttackStructures()
            }

            // Heal nearby creeps

            if (this.passiveHeal()) return true

            this.message = 'EC'

            const enemyCreep = findClosestObject(this.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.room.visual.line(this.pos, enemyCreep.pos, { color: customColors.green, opacity: 0.3 })

            // Get the range between the creeps

            const range = getRangeXY(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y)

            // If the range is more than 1

            if (range > 1) {
                this.rangedAttack(enemyCreep)

                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.rangedMassAttack()
            if (enemyCreep.canMove && !enemyCreep.isOnExit) this.assignMoveRequest(enemyCreep.pos)
            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.pos, enemyAttackers)
        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, enemyAttacker.pos, { color: customColors.green, opacity: 0.3 })

        // Get the range between the creeps

        const range = getRangeXY(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y)

        // If it's more than range 3

        if (range > 3) {
            // Heal nearby creeps

            this.passiveHeal()

            // Make a moveRequest to it and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        this.message = 'AEA'

        // Have the creep pre-heal itself

        this.heal(this)

        if (range === 1) this.rangedMassAttack()
        else this.rangedAttack(enemyAttacker)

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.combatStrength.heal < enemyAttacker.combatStrength.ranged) {
            if (range === 3) return true

            // If too close

            if (range <= 2) {
                // Have the creep flee

                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                })
            }

            return true
        }

        if (range > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        if (enemyAttacker.canMove) this.assignMoveRequest(enemyAttacker.pos)
        return true
    }

    rangedAttackStructures?() {
        this.message = 'RAS'

        const structures = this.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.pos, structures)
        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, structure.pos, { color: customColors.green, opacity: 0.3 })

        if (getRangeXY(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) > 3) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })

            return false
        }

        if (this.rangedAttack(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.nextHits -= this.parts.ranged_attack * RANGED_ATTACK_POWER
        if (structure.nextHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.pos, structures)

        if (getRangeXY(this.pos.x, structure.pos.y, this.pos.y, structure.pos.y) > 3) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })
        }

        return true
    }

    advancedAttack?() {
        const { room } = this

        let enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit
        })

        if (!enemyAttackers.length) enemyAttackers = room.enemyAttackers

        // If there are none

        if (!enemyAttackers.length) {
            let enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit
            })

            if (!enemyCreeps) enemyCreeps = room.enemyCreeps

            if (!enemyCreeps.length) return this.attackStructures()

            this.message = 'EC'

            const enemyCreep = findClosestObject(this.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.room.visual.line(this.pos, enemyCreep.pos, { color: customColors.green, opacity: 0.3 })

            // If the range is more than 1

            if (getRangeXY(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y) > 1) {
                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.attack(enemyCreep)

            if (enemyCreep.canMove) this.assignMoveRequest(enemyCreep.pos)
            return true
        }

        const enemyAttacker = findClosestObject(this.pos, enemyAttackers)
        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, enemyAttacker.pos, { color: customColors.green, opacity: 0.3 })

        // If the range is more than 1

        if (getRangeXY(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y) > 1) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        this.attack(enemyAttacker)

        if (this.canMove && enemyAttacker.canMove) this.assignMoveRequest(enemyAttacker.pos)
        return true
    }

    attackStructures?() {
        this.message = 'AS'

        const structures = this.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.pos, structures)
        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, structure.pos, { color: customColors.green, opacity: 0.3 })

        if (getRangeXY(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })

            return false
        }

        if (this.attack(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.nextHits -= this.parts.attack * ATTACK_POWER
        if (structure.nextHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.pos, structures)

        if (getRangeXY(this.pos.x, structure.pos.y, this.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        return true
    }

    advancedDismantle?() {
        // Avoid targets we can't dismantle

        const structures = this.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.pos, structures)
        if (Memory.roomVisuals)
            this.room.visual.line(this.pos, structure.pos, { color: customColors.green, opacity: 0.3 })

        if (getRangeXY(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })

            return true
        }

        if (this.dismantle(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.nextHits -= this.parts.work * DISMANTLE_POWER
        if (structure.nextHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.pos, structures)

        if (getRangeXY(this.pos.x, structure.pos.y, this.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        return true
    }

    stompEnemyCSites?() {
        if (this.room.controller && this.room.controller.safeMode) return false

        // Filter only enemy construction sites worth stomping

        const enemyCSites = this.room.enemyCSites.filter(cSite => cSite.progress > 0 && !isCoordExit(cSite.pos))

        if (!enemyCSites.length) return false

        const enemyCSite = findClosestObject(this.pos, enemyCSites)

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: enemyCSite.pos, range: 0 }],
        })

        return true
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Antifa = Game.creeps[creepName]
            if (creep.spawning) continue

            if (!creep.runSquad()) creep.runSingle()
        }
    }
}
