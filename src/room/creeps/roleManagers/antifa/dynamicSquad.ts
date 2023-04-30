import { CreepMemoryKeys, customColors, roomDimensions } from 'international/constants'
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
    leader: Antifa

    constructor(memberNames: string[]) {
        for (let i = 0; i < memberNames.length; i++) {
            const member = Game.creeps[memberNames[i]]
            this.members.push(member)
            memberNames.push(member.name)

            member.squad = this
            member.squadRan = true
        }

        this.leader = this.members[0]
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
        /*
        if (this.leader.memory[CreepMemoryKeys.squadCombatType] === 'rangedAttack') return this.advancedRangedAttack()
        if (this.leader.memory[CreepMemoryKeys.squadCombatType] === 'attack') return this.advancedAttack()
        return this.advancedDismantle()
         */
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
