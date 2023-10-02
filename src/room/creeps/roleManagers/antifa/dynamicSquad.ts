import {
    CreepMemoryKeys,
    Result,
    RoomTypes,
    customColors,
    roomDimensions,
    squadQuotas,
} from 'international/constants'
import { findClosestObject, getRangeXY, getRange, isExit, isXYExit } from 'utils/utils'
import { Antifa } from './antifa'
import { CustomPathFinderArgs } from 'international/customPathFinder'

/**
 * A squad of a semi-dynamic size
 * Accepts at most 1 of each: antifaRangedAttacker, antifaAttacker, antifaHealer, antifaDismantler
 */
export class DynamicSquad {
    /**
     *
     */
    moveType: SquadMoveTypes
    /**
     * All squad members, where index 0 is the leader
     */
    members: Antifa[] = []
    memberNames: string[] = []
    membersByType: Partial<{ [role in CreepRoles]: string[] }>
    leader: Antifa

    constructor(memberNames: string[]) {
        this.membersByType = {}
        for (const role in squadQuotas.dynamic.antifaRangedAttacker) {
            this.membersByType[role as CreepRoles] = []
        }

        for (let i = 0; i < memberNames.length; i++) {
            const member = Game.creeps[memberNames[i]]
            this.members.push(member)
            memberNames.push(member.name)
            this.membersByType[member.role].push(member.name)

            member.squad = this
            member.squadRan = true
        }

        this.moveType = this.leader.memory[CreepMemoryKeys.squadMoveType]

        // Ensure the leader is the one with melee parts, if the quad is melee

        if (
            !(this.leader.parts.attack + this.leader.parts.work) &&
            this.members[1].parts.attack + this.members[1].parts.work
        ) {
            this.members.reverse()
            this.leader = this.members[0]
        }
    }

    run() {
        if (this.runCombatRoom()) return

        this.advancedHeal()

        if (!this.getInFormation()) return

        this.leader.message = 'IF'
        /*
        if (this.leader.room.roomManager.enemyDamageThreat && this.runCombat()) return
 */
        this.createMoveRequest({
            origin: this.leader.pos,
            goals: [
                {
                    pos: new RoomPosition(
                        25,
                        25,
                        this.leader.memory[CreepMemoryKeys.combatRequest],
                    ),
                    range: 25,
                },
            ],
            typeWeights: {
                [RoomTypes.enemy]: Infinity,
                [RoomTypes.ally]: Infinity,
                [RoomTypes.sourceKeeper]: Infinity,
                [RoomTypes.enemyRemote]: 4,
                [RoomTypes.allyRemote]: 4,
                [RoomTypes.neutral]: 2,
            },
        })
    }

    runCombatRoom() {
        if (this.leader.room.name !== this.leader.memory[CreepMemoryKeys.combatRequest])
            return false

        if (!this.leader.room.roomManager.enemyDamageThreat) {
            for (const member of this.members) member.runCombat()
            return true
        }
        /*
        if (this.runCombat()) return true

        this.stompEnemyCSites()
         */
        return true
    }

    runCombat() {
        this.runCombatAttackDuo()
        this.runCombatRangedAttacker()
        this.runCombatDismantler()
    }

    combatAttackDuoGetInFormation(attacker: Creep, healer: Creep) {
        const range = getRange(attacker.pos, healer.pos)

        if (range > 1) {
            if (range > 2) {
                attacker.createMoveRequest({
                    goals: [
                        {
                            pos: healer.pos,
                            range: 1,
                        },
                    ],
                })
            }

            healer.createMoveRequest({
                goals: [
                    {
                        pos: attacker.pos,
                        range: 1,
                    },
                ],
            })
            return Result.action
        }

        return Result.success
    }

    runCombatAttackDuo() {
        const attackerName = this.membersByType.antifaAttacker[0]
        if (!attackerName) return

        const healerName = this.membersByType.antifaHealer[0]
        if (!healerName) return

        const attacker = Game.creeps[attackerName]
        const healer = Game.creeps[healerName]

        this.combatAttackDuoGetInFormation(attacker, healer)
    }

    runCombatRangedAttacker() {
        const creepName = this.membersByType.antifaRangedAttacker[0]
        if (!creepName) return false

        const creep = Game.creeps[creepName]

        let enemyAttackers = creep.room.roomManager.enemyAttackers.filter(function (enemyAttacker) {
            return !enemyAttacker.isOnExit
        })

        if (!enemyAttackers.length) enemyAttackers = creep.room.roomManager.enemyAttackers

        // If there are none

        if (!enemyAttackers.length) {
            let enemyCreeps = creep.room.roomManager.notMyCreeps.enemy.filter(function (
                enemyAttacker,
            ) {
                return !enemyAttacker.isOnExit
            })

            if (!enemyCreeps.length) enemyCreeps = creep.room.roomManager.notMyCreeps.enemy

            if (!enemyCreeps.length) {
                if (creep.aggressiveHeal()) return true
                return this.rangedAttackStructures(creep)
            }

            // Heal nearby creeps

            if (creep.passiveHeal()) return true

            creep.message = 'EC'

            const enemyCreep = findClosestObject(creep.pos, enemyCreeps)
            if (global.settings.roomVisuals)
                creep.room.visual.line(creep.pos, enemyCreep.pos, {
                    color: customColors.green,
                    opacity: 0.3,
                })

            // Get the range between the creeps

            const range = getRangeXY(creep.pos.x, enemyCreep.pos.x, creep.pos.y, enemyCreep.pos.y)

            // If the range is more than 1

            if (range > 1) {
                creep.rangedAttack(enemyCreep)

                // Have the create a moveRequest to the enemyAttacker and inform true

                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            creep.rangedMassAttack()
            if (enemyCreep.canMove && !enemyCreep.isOnExit) creep.assignMoveRequest(enemyCreep.pos)
            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(creep.pos, enemyAttackers)
        if (global.settings.roomVisuals)
            creep.room.visual.line(creep.pos, enemyAttacker.pos, {
                color: customColors.green,
                opacity: 0.3,
            })

        // Get the range between the creeps

        const range = getRangeXY(creep.pos.x, enemyAttacker.pos.x, creep.pos.y, enemyAttacker.pos.y)

        // If it's more than range 3

        if (range > 3) {
            // Heal nearby creeps

            creep.passiveHeal()

            // Make a moveRequest to it and inform true

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        creep.message = 'AEA'

        // Have the creep pre-heal itself

        creep.heal(creep)

        if (range === 1) creep.rangedMassAttack()
        else creep.rangedAttack(enemyAttacker)

        // If the creep has less heal power than the enemyAttacker's attack power

        if (creep.combatStrength.heal < enemyAttacker.combatStrength.ranged) {
            if (range === 3) return true

            // If too close

            if (range <= 2) {
                // Have the creep flee

                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                })
            }

            return true
        }

        if (range > 1) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        if (enemyAttacker.canMove) creep.assignMoveRequest(enemyAttacker.pos)
        return true
    }

    rangedAttackStructures?(creep: Creep) {
        creep.message = 'RAS'

        const structures = creep.room.roomManager.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(creep.pos, structures)
        if (global.settings.roomVisuals)
            creep.room.visual.line(creep.pos, structure.pos, {
                color: customColors.green,
                opacity: 0.3,
            })

        if (getRangeXY(creep.pos.x, structure.pos.x, creep.pos.y, structure.pos.y) > 3) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })

            return false
        }

        if (creep.rangedAttack(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.nextHits -= creep.parts.ranged_attack * RANGED_ATTACK_POWER
        if (structure.nextHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(creep.pos, structures)

        if (getRangeXY(creep.pos.x, structure.pos.y, creep.pos.y, structure.pos.y) > 3) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })
        }

        return true
    }

    runCombatDismantler() {
        const creepName = this.membersByType.antifaDismantler[0]
        if (!creepName) return false

        const creep = Game.creeps[creepName]

        // Avoid targets we can't dismantle

        const structures = creep.room.roomManager.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(creep.pos, structures)
        if (global.settings.roomVisuals)
            creep.room.visual.line(creep.pos, structure.pos, {
                color: customColors.green,
                opacity: 0.3,
            })

        if (getRange(creep.pos, structure.pos) > 1) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })

            return true
        }

        if (creep.dismantle(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.nextHits -= creep.parts.work * DISMANTLE_POWER
        if (structure.nextHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(creep.pos, structures)

        if (getRange(creep.pos, structure.pos) > 1) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        return true
    }

    getInFormation() {
        if (this.leader.room.name === this.members[1].room.name) {
            const range = getRange(this.leader.pos, this.members[1].pos)
            if (range === 1) return true

            if (range > 2) {
                this.leader.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [
                        {
                            pos: this.members[1].pos,
                            range: 1,
                        },
                    ],
                })
            }
        }

        this.leader.message = 'GIF'

        this.members[1].createMoveRequest({
            origin: this.members[1].pos,
            goals: [
                {
                    pos: this.leader.pos,
                    range: 1,
                },
            ],
        })

        return this.leader.isOnExit
    }

    holdFormation() {
        for (const member of this.members) member.moved = 'moved'
    }

    createMoveRequest(opts: CustomPathFinderArgs, moveLeader = this.leader) {
        if (!this.canMove) {
            this.holdFormation()
            return
        }
        this.leader.message = 'x'
        if (!moveLeader.createMoveRequest(opts)) return

        if (getRange(this.leader.pos, this.members[1].pos) > 1) {
            this.members[1].createMoveRequest({
                origin: this.members[1].pos,
                goals: [
                    {
                        pos: this.leader.pos,
                        range: 1,
                    },
                ],
            })

            return
        }

        this.members[1].assignMoveRequest(moveLeader.pos)
    }

    private advancedHeal() {}

    setMoveType(type: SquadMoveTypes) {
        this.moveType = type
        for (const memberName of this.memberNames) {
            Memory.creeps[memberName][CreepMemoryKeys.squadMoveType] = type
        }
    }

    _combatStrength: CombatStrength
    get combatStrength() {
        if (this._combatStrength) return this._combatStrength

        this._combatStrength = {
            dismantle: 0,
            melee: 0,
            ranged: 0,
            heal: 0,
        }

        for (const member of this.members) {
            for (const key in this._combatStrength) {
                const combatType = key as keyof CombatStrength

                this._combatStrength[combatType] = member.combatStrength[combatType]
            }
        }

        return this._combatStrength
    }

    get canMove() {
        for (const member of this.members) if (!member.canMove) return false
        return true
    }
}
