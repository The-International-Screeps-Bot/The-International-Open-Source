import { myColors, quadAttackMemberOffsets, quadTransformIndexes, quadTransformOffsets, roomDimensions } from 'international/constants'
import {
    areCoordsEqual,
    arePositionsEqual,
    customLog,
    doesCoordExist,
    doesXYExist,
    findClosestObject,
    getRange,
    getRangeOfCoords,
    isCoordExit,
    isXYExit,
} from 'international/utils'
import { packCoord, packXYAsCoord, unpackCoord } from 'other/packrat'
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
    membersByCoord: { [packedCoord: string]: Antifa }

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

            member.squad = this
            member.squadRan = true
        }

        this.sortMembersByCoord()
    }

    sortMembersByCoord() {

        const unsortedMembersByCoord: { [packedCoord: string]: Antifa } = {}

        for (const member of this.members) {
            unsortedMembersByCoord[packCoord(member.pos)] = member
        }

        this.membersByCoord = {
            [packCoord(this.leader.pos)]: this.leader,
        }

        const packedMemberCoords = [
            packXYAsCoord(this.leader.pos.x, this.leader.pos.y + 1),
            packXYAsCoord(this.leader.pos.x + 1, this.leader.pos.y + 1),
            packXYAsCoord(this.leader.pos.x + 1, this.leader.pos.y),
        ]

        for (const packedCoord of packedMemberCoords) {
            const member = unsortedMembersByCoord[packedCoord]
            if (!member) continue

            this.membersByCoord[packedCoord] = member
        }
    }

    run() {
        this.leader.say(this.type)

        if (!this.getInFormation()) return

        this.leader.say('IF')

        if (this.leader.room.name === this.leader.memory.CRN) {
            this.advancedHeal()
            this.runCombat()
            return
        }

        this.passiveHeal()
        this.passiveRangedAttack()

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

        if (this.leader.room.quadCostMatrix.get(this.leader.pos.x, this.leader.pos.y) >= 254) {
            /*
            this.leader.createMoveRequest({
                goals: [
                    {
                        pos: this.leader.pos,
                        range: 1,
                    },
                ],
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

        for (let i = 1; i < this.members.length; i++) {
            const offset = quadAttackMemberOffsets[i]
            const goalCoord = {
                x: this.leader.pos.x + offset.x,
                y: this.leader.pos.y + offset.y,
            }

            if (isCoordExit(goalCoord)) return true

            if (!doesCoordExist(goalCoord)) return true

            /* if (this.leader.room.quadCostMatrix.get(goalPos.x, goalPos.y) === 255) return true */
        }

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            const offset = quadAttackMemberOffsets[i]
            const goalPos = new RoomPosition(
                this.leader.pos.x + offset.x,
                this.leader.pos.y + offset.y,
                this.leader.room.name,
            )

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
        if (!this.canMove) return false

        this.leader.say('R')

        if (this.type === 'transport') {
            if (!moveLeader.createMoveRequest(opts)) return false

            let lastMember = moveLeader

            for (let i = 1; i < this.members.length; i++) {
                const member = this.members[i]
                member.assignMoveRequest(lastMember.pos)

                lastMember = member
            }

            return true
        }

        // Attack mode

        opts.weightCostMatrixes = ['quadCostMatrix']
        if (!moveLeader.createMoveRequest(opts)) return false

        if (!this.membersAttackMove()) return false
        return true
    }

    membersAttackMove(moveLeader = this.leader) {
        const moveRequestCoord = unpackCoord(moveLeader.moveRequest)

        const moveLeaderOffset = {
            x: moveLeader.pos.x - moveRequestCoord.x,
            y: moveLeader.pos.y - moveRequestCoord.y,
        }
/*
        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]

            if (!doesXYExist(member.pos.x - moveLeaderOffset.x, member.pos.y - moveLeaderOffset.y)) return false
        }
 */
        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            const goalCoord = {
                x: member.pos.x - moveLeaderOffset.x,
                y: member.pos.y - moveLeaderOffset.y,
            }

            if (!doesCoordExist(goalCoord)) continue

            member.assignMoveRequest(goalCoord)
        }

        return true
    }

    transform(transformType: QuadTransformTypes) {
        if (!this.canMove) return false

        const transformOffsets = quadTransformOffsets[transformType]
        const newIndexes = quadTransformIndexes[transformType]
        const membersByCoordArray = Object.values(this.membersByCoord)
        const newMemberNames: string[] = []

        for (let i = 0; i < membersByCoordArray.length; i++) {
            const member = membersByCoordArray[i]
            if (!member) continue

            const offset = transformOffsets[i]
            member.assignMoveRequest({ x: member.pos.x + offset.x, y: member.pos.y + offset.y })

            const newIndex = newIndexes[i]
            newMemberNames[newIndex] = member.name
        }

        for (const member of this.members) {
            member.memory.SMNs = newMemberNames
        }

        return true
    }

    runCombat() {
        if (this.leader.memory.ST === 'rangedAttack') return this.advancedRangedAttack()
        if (this.leader.memory.ST === 'attack') return this.advancedAttack()
        return this.advancedDismantle()
    }

    passiveHeal() {
        for (const member1 of this.members) {
            if (member1.hits === member1.hitsMax) continue

            for (const member2 of this.members) {
                member2.heal(member1)
                member2.ranged = true
            }

            return
        }

        for (const member of this.members) {
            member.passiveHeal()
        }
    }

    passiveRangedAttack() {
        for (const member of this.members) {
            if (member.ranged) continue

            let enemyCreeps = member.room.enemyAttackers
            if (!enemyCreeps.length) {
                enemyCreeps = member.room.enemyCreeps
                if (!enemyCreeps.length) continue
            }

            const enemyCreep = findClosestObject(member.pos, enemyCreeps)

            const range = getRangeOfCoords(member.pos, enemyCreep.pos)
            if (range > 3) continue

            member.ranged = true

            if (range > 1) {
                member.rangedAttack(enemyCreep)
                continue
            }

            member.rangedMassAttack()
        }
    }

    advancedRangedAttack() {
        const { room } = this.leader

        let enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        if (!room.enemyAttackers.length) enemyAttackers = room.enemyAttackers

        // If there are none

        if (!enemyAttackers.length) {
            let enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            if (!room.enemyCreeps.length) enemyCreeps = room.enemyCreeps

            if (!enemyCreeps.length) {
                return this.rangedAttackStructures()
            }

            this.leader.say('EC')

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

            // Get the range between the creeps

            const range = getRange(this.leader.pos.x, enemyCreep.pos.x, this.leader.pos.y, enemyCreep.pos.y)

            // If the range is more than 1

            if (range > 1) {
                for (const member of this.members) member.rangedAttack(enemyCreep)

                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.leader.rangedMassAttack()
            for (let i = 1; i < this.members.length; i++) {
                const member = this.members[i]
                member.rangedAttack(enemyCreep)
            }

            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.leader.pos, enemyAttackers)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, { color: myColors.green, opacity: 0.3 })

        // Get the range between the creeps

        const range = getRange(this.leader.pos.x, enemyAttacker.pos.x, this.leader.pos.y, enemyAttacker.pos.y)

        // If it's more than range 3

        if (range > 3) {
            // Heal nearby creeps

            this.leader.passiveHeal()

            // Make a moveRequest to it and inform true

            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        this.leader.say('AEA')

        if (range === 1) this.leader.rangedMassAttack()
        else this.leader.rangedAttack(enemyAttacker)

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            member.rangedAttack(enemyAttacker)
        }

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.leader.healStrength < enemyAttacker.attackStrength) {
            if (range === 3) return true

            // If too close

            if (range <= 2) {
                // Have the squad flee

                this.createMoveRequest(
                    {
                        origin: this.leader.pos,
                        goals: [{ pos: enemyAttacker.pos, range: 1 }],
                        flee: true,
                    },
                    this.members[1],
                )
            }

            return true
        }

        if (range > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        return true
    }

    rangedAttackStructures() {
        const structures = this.leader.room.dismantleableTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, structure.pos, { color: myColors.green, opacity: 0.3 })

        if (getRange(this.leader.pos.x, structure.pos.x, this.leader.pos.y, structure.pos.y) > 3) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })

            return false
        }

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            member.rangedAttack(structure)
        }

        if (this.leader.rangedAttack(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.realHits = structure.hits - this.leader.parts.ranged_attack * RANGED_ATTACK_POWER
        if (structure.realHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.leader.pos, structures)

        if (getRange(this.leader.pos.x, structure.pos.y, this.leader.pos.y, structure.pos.y) > 3) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })
        }

        return true
    }
    advancedAttack() {}
    advancedDismantle() {}
    advancedHeal() {
        for (const member1 of this.members) {
            if (member1.hits === member1.hitsMax) continue

            for (const member2 of this.members) {
                member2.heal(member1)
            }

            return
        }

        for (const member of this.members) {
            if (!member.room.enemyAttackers.length) continue

            member.heal(member)
        }
    }
}
