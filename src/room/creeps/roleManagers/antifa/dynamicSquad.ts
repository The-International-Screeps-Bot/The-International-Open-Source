import { CreepMemoryKeys, RESULT_ACTION, RESULT_SUCCESS, customColors, roomDimensions, squadQuotas } from 'international/constants'
import { findClosestObject, getRangeXY, getRange, isCoordExit, isXYExit } from 'international/utils'
import { Antifa } from './antifa'

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
    membersByType: Partial<{[role in CreepRoles]: string[] }>
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
        if (this.leader.room.enemyDamageThreat && this.runCombat()) return
 */
        this.createMoveRequest({
            origin: this.leader.pos,
            goals: [
                {
                    pos: new RoomPosition(25, 25, this.leader.memory[CreepMemoryKeys.combatRequest]),
                    range: 25,
                },
            ],
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                enemyRemote: 4,
                allyRemote: 4,
                neutral: 2,
            },
        })
    }

    runCombatRoom() {
        if (this.leader.room.name !== this.leader.memory[CreepMemoryKeys.combatRequest]) return false

        if (!this.leader.room.enemyDamageThreat) {
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
        this.runCombatRangedHeal()
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
            return RESULT_ACTION
        }

        return RESULT_SUCCESS
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

    runCombatRangedHeal() {

        const creepName = this.membersByType.antifaRangedAttacker[0]
        if (!creepName) return

        const creep = Game.creeps[creepName]


    }

    runCombatDismantler() {

        const creepName = this.membersByType.antifaDismantler[0]
        if (!creepName) return false

        const creep = Game.creeps[creepName]

        // Avoid targets we can't dismantle

        const structures = creep.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(creep.pos, structures)
        if (Memory.roomVisuals)
            creep.room.visual.line(creep.pos, structure.pos, { color: customColors.green, opacity: 0.3 })

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

    createMoveRequest(opts: MoveRequestOpts, moveLeader = this.leader) {
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
