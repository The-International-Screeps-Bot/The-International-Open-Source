import {
    myColors,
    quadAttackMemberOffsets,
    quadTransformIndexes,
    quadTransformOffsets,
    roomDimensions,
} from 'international/constants'
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
import { AllyCreepRequestManager } from 'room/allyCreepRequestManager'
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

        if (this.runCombatRoom()) return

        if (!this.getInFormation()) return

        this.leader.say('IF')

        if (this.leader.room.enemyAttackers.length) this.advancedRangedAttack()

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

    runCombatRoom() {
        if (this.leader.room.name !== this.leader.memory.CRN) return false

        if (!this.leader.room.enemyAttackers.length && !this.leader.room.structures.tower.length) {
            for (const member of this.members) member.runSingle()
            return true
        }

        if (!this.getInFormation()) return true

        this.advancedHeal()
        this.runCombat()
        return true
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

    holdFormation() {

        for (const member of this.members) member.moved = 'moved'
    }

    createMoveRequest(opts: MoveRequestOpts, moveLeader = this.leader) {
        if (!this.canMove) {

            this.holdFormation()
            return false
        }

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
        if (!this.canMove) {

            this.holdFormation()
            return false
        }

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
        if (this.leader.memory.ST === 'rangedAttack') {
            if (this.advancedRangedAttack()) return true
            if (this.rangedAttackStructures()) return true
        }
        if (this.leader.memory.ST === 'attack') {
            if (this.advancedAttack()) return true
        }
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

    rangedAttack(target: Creep | Structure) {
        if (!(target as AnyOwnedStructure).owner) {
            for (const member of this.members) {
                if (getRangeOfCoords(member.pos, target.pos) > 3) continue

                member.rangedAttack(target)
            }

            return
        }

        for (const member of this.members) {
            const range = getRangeOfCoords(member.pos, target.pos)
            if (range > 3) continue

            member.ranged = true

            if (range > 1) {
                member.rangedAttack(target)
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

            const range = this.findMinRange(enemyCreep.pos)

            // If the range is more than 1

            if (range > 1) {
                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            if (range < 3) {
                this.rangedAttack(enemyCreep)
            }

            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.leader.pos, enemyAttackers)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, { color: myColors.green, opacity: 0.3 })

        const range = this.findMinRange(enemyAttacker.pos)

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

        this.rangedAttack(enemyAttacker)

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.leader.healStrength < enemyAttacker.attackStrength) {
            if (range === 3) return true

            // If too close

            if (range <= 2) {
                // Have the squad flee

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                })
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
        const structures = this.leader.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, structure.pos, { color: myColors.green, opacity: 0.3 })

        const range = this.findMinRange(structure.pos)

        if (range > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 3 }],
            })

            return false
        }

        if (range > 3) return false

        this.rangedAttack(structure)
        return true
    }
    advancedAttack() {
        return true
    }
    advancedDismantle() {
        return true
    }
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

    findMinRange(coord: Coord) {
        let minRange = Infinity

        for (const member of this.members) {
            const range = getRangeOfCoords(member.pos, coord)
            if (range < minRange) minRange = range
        }

        return minRange
    }
}
