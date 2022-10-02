import { areCoordsEqual, arePositionsEqual, customLog, getRange, isExit, unpackAsPos } from 'international/utils'
import { packCoord } from 'other/packrat'
import { Antifa } from './antifa'

export class Quad {
    /**
     *
     */
    type: 'transport' | 'attack'
    /**
     * All squad members, where index 0 is the leader
     */
    members: Antifa[]
    leader: Antifa
    expectedSize: 4
    membersByPosition: Map<string, Antifa> = new Map()

    _healStrength: number

    get healStrength() {
        if (this._healStrength !== undefined) return this._healStrength

        this._healStrength = 0

        for (const member of this.members) this._healStrength += member.healStrength

        return this._healStrength
    }

    _attackStrength: number

    get attackStrength() {
        if (this._attackStrength !== undefined) return this._attackStrength

        this._attackStrength = 0

        for (const member of this.members) this._attackStrength += member.attackStrength

        return this._attackStrength
    }

    get canMove() {
        for (const member of this.members) if (!member.canMove) return false
        return true
    }

    constructor(members: Antifa[]) {
        this.members = members
        this.leader = members[0]

        for (const member of members) {
            this.membersByPosition.set(packCoord(member.pos), member)
        }
    }
    run() {

        this.leader.say(this.type)

        this.advancedHeal()

        if (!this.getInFormation()) return
        /*
        if (this.leader.room.name === this.leader.memory.CRN) {

            if (this.runCombat()) return

            this.stompEnemyCSites()
            return
        }
 */
        this.createMoveRequest({
            goals: [
                {
                    pos: new RoomPosition(25, 25, this.leader.memory.CRN),
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
    getInFormation(): boolean {
        if (this.leader.isOnExit()) return true

        if (this.leader.room.quadCostMatrix.get(this.leader.pos.x, this.leader.pos.y) === 255) {
            /*
            this.leader.createMoveRequest({
                goals: [{
                    pos: this.leader.pos,
                    range: 1,
                }],
                flee: true,
            })
            return false
 */
            return true
        }

        let inFormation = true

        if (this.type === 'transport') {
            let lastMember = this.leader

            for (let i = 1; i < this.members.length; i++) {
                const member = this.members[i]

                if (
                    getRange(member.pos.x, lastMember.pos.x, member.pos.y, lastMember.pos.y) <= 1 &&
                    member.room.name === lastMember.room.name
                ) {
                    lastMember = member
                    continue
                }

                member.createMoveRequest({
                    goals: [
                        {
                            pos: lastMember.pos,
                            range: 1,
                        },
                    ],
                })

                lastMember = member
                inFormation = false
            }

            return inFormation
        }

        // Attack mode

        const memberGoalPositions = [
            new RoomPosition(this.leader.pos.x + 1, this.leader.pos.y, this.leader.room.name),
            new RoomPosition(this.leader.pos.x, this.leader.pos.y + 1, this.leader.room.name),
            new RoomPosition(this.leader.pos.x + 1, this.leader.pos.y + 1, this.leader.room.name),
        ]

        for (let i = 1; i < this.members.length; i++) {
            const goalPos = memberGoalPositions[i - 1]

            if (isExit(goalPos.x, goalPos.y)) return true
            /* if (this.leader.room.quadCostMatrix.get(goalPos.x, goalPos.y) === 255) return true */
        }

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            const goalPos = memberGoalPositions[i - 1]

            if (arePositionsEqual(member.pos, goalPos)) continue

            member.createMoveRequest({
                goals: [
                    {
                        pos: goalPos,
                        range: 0,
                    },
                ],
            })
            inFormation = false
        }

        return inFormation
    }
    createMoveRequest(opts: MoveRequestOpts, moveLeader = this.leader) {
        if (!this.canMove) return

        if (this.type === 'transport') {
            if (!moveLeader.createMoveRequest(opts)) return

            let lastMember = moveLeader

            for (let i = 1; i < this.members.length; i++) {
                const member = this.members[i]
                member.assignMoveRequest(lastMember.pos)

                lastMember = member
            }

            return
        }

        // Attack mode

        opts.weightCostMatrixes = ['quadCostMatrix']
        if (!moveLeader.createMoveRequest(opts)) return

        const moveRequestCoord = unpackAsPos(moveLeader.moveRequest)

        const offset = {
            x: moveLeader.pos.x - moveRequestCoord.x,
            y: moveLeader.pos.y - moveRequestCoord.y,
        }

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]

            member.assignMoveRequest({
                x: member.pos.x - offset.x,
                y: member.pos.y - offset.y,
            })
        }
    }
    rotate() {}
    advancedRangedAttack() {}
    advancedAttack() {}
    advancedDismantle() {}
    advancedHeal() {

        for (const member of this.members) {

            if (member.hits < member.hitsMax) member.heal(member)
        }

        for (const member of this.members) {

            if (!member.room.enemyAttackers.length) continue

            member.heal(member)
        }
    }
}
