import {
    CombatRequestData,
    customColors,
    numbersByStructureTypes,
    quadAttackMemberOffsets,
    quadTransformIndexes,
    quadTransformOffsets,
    rangedMassAttackMultiplierByRange,
    roomDimensions,
} from 'international/constants'
import {
    areCoordsEqual,
    arePositionsEqual,
    customLog,
    doesCoordExist,
    doesXYExist,
    findClosestObject,
    findCoordsInsideRect,
    findObjectWithID,
    getRange,
    getRangeOfCoords,
    isCoordExit,
    isXYExit,
} from 'international/utils'
import { find, transform } from 'lodash'
import { packCoord, packXYAsCoord, unpackCoord } from 'other/codec'
import { Antifa } from './antifa'

export class Quad {
    /**
     *
     */
    type: 'transport' | 'attack'
    /**
     * All squad members, where index 0 is the leader
     */
    members: Antifa[] = []
    leader: Antifa
    membersByCoord: { [packedCoord: string]: Antifa }

    target: Structure | Creep

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

    _enemyThreatCoords: Set<string>

    get enemyThreatCoords() {
        if (this._enemyThreatCoords) return this._enemyThreatCoords

        this._enemyThreatCoords = new Set()

        const enemyAttackers: Creep[] = []
        const enemyRangedAttackers: Creep[] = []

        for (const enemyCreep of this.leader.room.enemyAttackers) {
            // We have sufficient superiority to ignore kiting this creep

            if (
                this.combatStrength.heal + this.combatStrength.melee + this.combatStrength.ranged >
                (enemyCreep.combatStrength.heal + enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged) *
                    1.2
            )
                continue

            // Segregate by ranged

            if (enemyCreep.parts.ranged_attack) {
                enemyRangedAttackers.push(enemyCreep)
                continue
            }

            // Segregate by melee

            enemyAttackers.push(enemyCreep)
        }

        for (const enemyAttacker of enemyAttackers) {
            // Construct rect and get positions inside

            const coords = findCoordsInsideRect(
                enemyAttacker.pos.x - 2,
                enemyAttacker.pos.y - 2,
                enemyAttacker.pos.x + 2,
                enemyAttacker.pos.y + 2,
            )

            for (const coord of coords) this._enemyThreatCoords.add(packCoord(coord))
        }

        for (const enemyAttacker of enemyRangedAttackers) {
            // Construct rect and get positions inside

            const coords = findCoordsInsideRect(
                enemyAttacker.pos.x - 3,
                enemyAttacker.pos.y - 3,
                enemyAttacker.pos.x + 3,
                enemyAttacker.pos.y + 3,
            )

            for (const coord of coords) this._enemyThreatCoords.add(packCoord(coord))
        }

        for (const packedCoord of this._enemyThreatCoords) {
            const coord = unpackCoord(packedCoord)

            this.leader.room.visual.circle(coord.x, coord.y, { fill: customColors.red })
        }

        return this._enemyThreatCoords
    }

    _enemyThreatGoals: PathGoal[]

    get enemyThreatGoals() {
        this._enemyThreatGoals = []

        for (const enemyCreep of this.leader.room.enemyAttackers) {
            // The enemy is weak enough to be ignored

            if (
                (enemyCreep.combatStrength.ranged + enemyCreep.combatStrength.melee + enemyCreep.combatStrength.heal) *
                    1.2 <
                this.combatStrength.ranged + this.combatStrength.melee + this.combatStrength.heal
            )
                continue

            if (enemyCreep.parts.ranged_attack) {
                this._enemyThreatGoals.push({
                    pos: enemyCreep.pos,
                    range: 5,
                })
                continue
            }

            if (!enemyCreep.parts.attack) continue

            this._enemyThreatGoals.push({
                pos: enemyCreep.pos,
                range: 3,
            })
        }

        return this._enemyThreatGoals
    }

    get canMove() {
        for (const member of this.members) {
            if (!member.canMove) return false
        }
        return true
    }

    get willMove() {
        for (const member of this.members) {
            if (!member.canMove) return false
            if (member.moveRequest) return false
        }

        return true
    }

    constructor(memberNames: string[]) {
        for (const memberName of memberNames) {
            const member = Game.creeps[memberName]
            this.members.push(member)

            member.squad = this
            member.squadRan = true
        }

        this.leader = this.members[0]

        this.sortMembersByCoord()

        if (Memory.combatRequests[this.leader.memory.CRN])
            Memory.combatRequests[this.leader.memory.CRN].data[CombatRequestData.quads] += 1
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
        this.leader.message = this.type

        this.passiveHealQuad()

        if (this.runCombatRoom()) return

        if (!this.getInFormation()) {
            this.passiveRangedAttack()
            return
        }

        this.leader.message = 'IF'

        if (this.leader.room.enemyDamageThreat && this.runCombat()) return

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
                keeper: 5,
                enemyRemote: 5,
                allyRemote: 5,
                neutral: 2,
            },
        })
    }

    runCombatRoom() {
        if (this.leader.room.name !== this.leader.memory.CRN) return false
        /*
        if (!this.leader.room.enemyDamageThreat) {
            for (const member of this.members) member.runCombat()
            return true
        }
 */
        if (!this.getInFormation()) {
            this.passiveRangedAttack()
            return true
        }

        this.runCombat()

        return true
    }

    runCombat() {
        if (this.leader.memory.SCT === 'rangedAttack') {
            this.passiveRangedAttack()

            const nearbyThreat = this.leader.room.enemyAttackers.find(
                enemyCreep =>
                    this.findMinRange(enemyCreep.pos) <= 4 &&
                    (enemyCreep.combatStrength.ranged || enemyCreep.combatStrength.melee),
            )
            if (nearbyThreat) this.advancedTransform()

            this.rangedKite()

            if (this.bulldoze()) return true
            if (this.advancedRangedAttack()) return true
            if (this.rangedAttackStructures()) return true
            return false
        }
        if (this.leader.memory.SCT === 'attack') {
            if (this.advancedAttack()) return false
        }

        this.advancedDismantle()
        return false
    }

    getInFormation(): boolean {
        if (this.leader.isOnExit) return true

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

                if (member.isOnExit) continue

                if (member.moveRequest === packCoord(this.leader.pos)) {
                }

                lastMember = member
                inFormation = false
            }

            return inFormation
        }

        let newLeader: Antifa
        let newLeaderIndex: number

        // Attack mode

        for (let i = 1; i < this.members.length; i++) {
            const offset = quadAttackMemberOffsets[i]
            const goalCoord = {
                x: this.leader.pos.x + offset.x,
                y: this.leader.pos.y + offset.y,
            }

            if (isCoordExit(goalCoord)) return true
            if (!doesCoordExist(goalCoord)) return true

            const goalPos = new RoomPosition(goalCoord.x, goalCoord.y, this.leader.room.name)

            const member = this.members[i]
            if (arePositionsEqual(member.pos, goalPos)) continue

            member.createMoveRequest({
                goals: [
                    {
                        pos: goalPos,
                        range: 0,
                    },
                ],
            })

            if (member.moveRequest === packCoord(this.leader.pos)) {
                newLeader = member
                newLeaderIndex = i
            }

            inFormation = false
        }

        if (newLeader) {
            this.members[newLeaderIndex] = this.leader
            this.members[0] = newLeader
            this.leader = newLeader

            const memberNames: string[] = []
            for (const member of this.members) {
                memberNames.push(member.name)
            }

            for (const member of this.members) {
                member.memory.SMNs = memberNames
            }
        }

        return inFormation
    }

    holdFormation() {
        for (const member of this.members) member.moved = 'moved'
    }

    createMoveRequest(opts: MoveRequestOpts, moveLeader = this.leader) {
        if (!this.willMove) {
            for (const member1 of this.members) {
                if (!member1.fatigue) continue

                for (const member2 of this.members) {
                    if (member2.name === member1.name) continue

                    member2.pull(member1)
                }
            }

            /* this.holdFormation() */
            return false
        }

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
        moveLeader.createMoveRequest(opts)

        if (!moveLeader.moveRequest) return false
        if (!this.membersAttackMove()) return false

        return true
    }

    membersAttackMove(moveLeader = this.leader) {
        const moveRequestCoord = unpackCoord(moveLeader.moveRequest)

        const moveLeaderOffset = {
            x: moveLeader.pos.x - moveRequestCoord.x,
            y: moveLeader.pos.y - moveRequestCoord.y,
        }

        for (let i = 1; i < this.members.length; i++) {
            const member = this.members[i]
            const goalCoord = {
                x: member.pos.x - moveLeaderOffset.x,
                y: member.pos.y - moveLeaderOffset.y,
            }

            if (!doesCoordExist(goalCoord)) continue

            if (member.room.quadCostMatrix.get(goalCoord.x, goalCoord.y) >= 255) continue

            member.assignMoveRequest(goalCoord)
        }

        return true
    }

    transform(transformType: QuadTransformTypes) {
        /*
        if (!this.canMove) {
            this.holdFormation()
            return false
        }
 */
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

    randomTransform() {
        const quadTransformKeys = Object.keys(quadTransformIndexes)
        return this.transform(
            quadTransformKeys[Math.floor(Math.random() * quadTransformKeys.length)] as QuadTransformTypes,
        )
    }

    scoreTransform(transformType: QuadTransformTypes) {
        let score = 0
        const transformOffsets = quadTransformOffsets[transformType]
        const membersByCoordArray = Object.values(this.membersByCoord)

        for (let i = 0; i < membersByCoordArray.length; i++) {
            const member = membersByCoordArray[i]
            if (!member) continue

            const offset = transformOffsets[i]

            score += (1 - member.defenceStrength) * 5000

            const range = getRange(
                this.target.pos.x,
                member.pos.x + offset.x,
                this.target.pos.y,
                member.pos.y + offset.y,
            )

            if (this.leader.memory.SCT === 'rangedAttack') {
                score += rangedMassAttackMultiplierByRange[range] * member.combatStrength.ranged || 0

                continue
            }

            if (this.leader.memory.SCT === 'attack') {
                score += member.combatStrength.melee
                continue
            }

            // Dismantle type

            score += member.combatStrength.dismantle
            continue
        }
        customLog(transformType, score)
        return score
    }

    advancedTransform(): boolean {
        if (!this.willMove) return false

        if (!this.target) return false

        let highestScore = 0
        let bestTransformName: QuadTransformTypes

        for (const transformType in quadTransformOffsets) {
            const score = this.scoreTransform(transformType as QuadTransformTypes)

            if (score <= highestScore) continue

            highestScore = score
            bestTransformName = transformType as QuadTransformTypes
        }

        customLog('FOUND TRANSFORM', bestTransformName)

        if (bestTransformName === 'none') return true
        return this.transform(bestTransformName)
    }

    passiveHealQuad() {
        let lowestHits = Infinity
        let lowestHitsMember: Creep | undefined

        for (const member of this.members) {
            if (member.hits === member.hitsMax) continue

            if (member.hits >= lowestHits) continue

            lowestHits = member.hits
            lowestHitsMember = member
        }

        if (lowestHitsMember) {
            for (const member of this.members) {
                if (member.worked) continue

                member.heal(lowestHitsMember)
                member.worked = true
            }

            return
        }

        if (this.preHeal()) return
    }

    shouldPreHeal() {
        // Inform true if there are enemy threats in range

        if (
            this.leader.room.enemyAttackers.find(
                enemyCreep =>
                    (enemyCreep.combatStrength.ranged && this.findMinRange(enemyCreep.pos) <= 3) ||
                    (enemyCreep.combatStrength.melee && this.findMinRange(enemyCreep.pos) <= 1),
            )
        )
            return true

        // Only inform true if there are enemy owned active towers

        const controller = this.leader.room.controller
        if (!controller) return false
        if (!controller.owner) return false
        if (controller.owner.username === Memory.me) return false
        if (Memory.allyPlayers.includes(controller.owner.username)) return false
        if (!this.leader.room.structures.tower.length) return false

        return true
    }

    /**
     * The precogs are delighted to assist
     */
    preHeal() {
        if (!this.shouldPreHeal()) return false

        // Have members semi-randomly heal each other

        const notHealedMembers = Array.from(this.members)

        for (const member of this.members) {
            const memberIndex = Math.floor(Math.random() * notHealedMembers.length)
            const memberHealer = notHealedMembers[memberIndex]

            memberHealer.heal(member)
            memberHealer.worked = true

            notHealedMembers.splice(memberIndex, 1)
        }

        return true
    }

    /**
     * Attack viable targets without moving
     */
    passiveRangedAttack() {
        const attackingMemberNames = new Set(this.leader.memory.SMNs)

        // Sort enemies by number of members that can attack them

        const enemyTargetsWithDamage: Map<Id<Creep>, number> = new Map()
        const enemyTargetsWithAntifa: Map<Id<Creep>, Id<Antifa>[]> = new Map()

        for (const enemyCreep of this.leader.room.unprotectedEnemyCreeps) {
            const memberIDsInRange: Id<Antifa>[] = []

            let netDamage = -1 * enemyCreep.combatStrength.heal

            for (const memberName of attackingMemberNames) {
                const member = Game.creeps[memberName]

                if (getRangeOfCoords(member.pos, enemyCreep.pos) > 3) continue

                netDamage += member.combatStrength.ranged

                memberIDsInRange.push(member.id)
            }

            if (!memberIDsInRange.length) continue

            enemyTargetsWithDamage.set(enemyCreep.id, netDamage)
            enemyTargetsWithAntifa.set(enemyCreep.id, memberIDsInRange)
            if (memberIDsInRange.length === this.members.length) break
        }

        const enemyTargetsByDamage = Array.from(enemyTargetsWithAntifa.keys()).sort((a, b) => {
            return enemyTargetsWithDamage.get(a) - enemyTargetsWithDamage.get(b)
        })

        // Attack enemies in order of most members that can attack them

        for (const enemyCreepID of enemyTargetsByDamage) {
            const enemyCreep = findObjectWithID(enemyCreepID)

            for (const memberID of enemyTargetsWithAntifa.get(enemyCreepID)) {
                const member = findObjectWithID(memberID)
                if (!attackingMemberNames.has(member.name)) continue

                if (getRangeOfCoords(member.pos, enemyCreep.pos) > 1) member.rangedAttack(enemyCreep)
                else member.rangedMassAttack()
                member.ranged = true

                attackingMemberNames.delete(member.name)
            }

            if (!attackingMemberNames.size) return
        }

        // If there is a target and there are members left that can attack, attack the target

        if (!this.target) return

        for (const memberName of attackingMemberNames) {
            const member = Game.creeps[memberName]

            const range = getRangeOfCoords(member.pos, this.target.pos)
            if (range > 3) continue

            if (range === 1) member.rangedMassAttack()
            else member.rangedAttack(this.target)
        }
    }

    advancedRangedAttack() {
        const { room } = this.leader

        let enemyCreeps = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit
        })

        if (!room.enemyAttackers.length) enemyCreeps = room.enemyAttackers

        // If there are none

        if (!enemyCreeps.length) {
            enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit
            })

            if (!enemyCreeps.length) enemyCreeps = room.enemyCreeps
            if (!enemyCreeps.length) return false

            this.leader.message = 'EC'

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, {
                    color: customColors.green,
                    opacity: 0.3,
                })

            // Get the range between the creeps

            const range = this.findMinRange(enemyCreep.pos)
            this.leader.message = range.toString()

            if (range <= 3) {
                this.target = enemyCreep
                this.passiveRangedAttack()
            }

            // If the range is more than 1

            if (range > 1) {
                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.leader.pos, enemyCreeps)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, {
                color: customColors.green,
                opacity: 0.3,
            })

        const range = this.findMinRange(enemyAttacker.pos)

        // If the squad is outmatched
        /*
        if (
            this.combatStrength.heal + this.combatStrength.ranged <
            enemyAttacker.combatStrength.heal + enemyAttacker.combatStrength.ranged
        ) {
            // If too close

            if (range <= 3) {
                this.target = enemyAttacker
                this.passiveRangedAttack()

                // Have the squad flee

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                })
            }

            return true
        }
 */
        // If it's more than range 3

        if (range > 3) {
            // Make a moveRequest to it and inform true

            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        this.leader.message = 'AEA'

        this.target = enemyAttacker
        this.passiveRangedAttack()

        if (range > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        return true
    }

    bulldoze() {
        const request = Memory.combatRequests[this.leader.memory.CRN]
        if (!request) return false
        if (request.T === 'defend') return false

        let bulldozeTarget: Structure
        this.leader.memory.QBTIDs = []
        let quadBulldozeTargetIDs = this.leader.memory.QBTIDs || []

        for (let i = 0; i < quadBulldozeTargetIDs.length; i++) {
            const ID = quadBulldozeTargetIDs[i]
            const structure = findObjectWithID(ID)
            if (!structure) {
                quadBulldozeTargetIDs.splice(i, 1)
                continue
            }

            bulldozeTarget = structure
        }

        if (!bulldozeTarget) {
            let bulldozeTargets: Structure[] = []
            bulldozeTargets = bulldozeTargets.concat(this.leader.room.structures.spawn)
            bulldozeTargets = bulldozeTargets.concat(this.leader.room.structures.tower)

            if (!bulldozeTargets.length) return false

            bulldozeTarget = findClosestObject(this.leader.pos, bulldozeTargets)

            quadBulldozeTargetIDs = this.leader.findQuadBulldozeTargets(bulldozeTarget.pos)
            if (!quadBulldozeTargetIDs.length) return false

            bulldozeTarget = findObjectWithID(quadBulldozeTargetIDs[0])
        }

        this.leader.room.targetVisual(this.leader.pos, bulldozeTarget.pos, true)

        const range = this.findMinRange(bulldozeTarget.pos)

        if (range > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: bulldozeTarget.pos, range: 1 }],
            })
        }

        if (range > 3) return true

        this.target = bulldozeTarget
        this.passiveRangedAttack()
        return true
    }

    rangedAttackStructures() {
        const request = Memory.combatRequests[this.leader.memory.CRN]
        if (!request) return false
        if (request.T === 'defend') return false

        const structures = this.leader.room.combatStructureTargets

        if (!structures.length) return false

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, structure.pos, { color: customColors.green, opacity: 0.3 })

        const range = this.findMinRange(structure.pos)

        if (range > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        if (range > 3) return true

        this.target = structure
        this.passiveRangedAttack()
        return true
    }

    advancedAttack() {
        return true
    }

    advancedDismantle() {
        return true
    }

    rangedKite() {
        if (!this.willMove) return

        for (const member of this.members) {
            if (!this.enemyThreatCoords.has(packCoord(member.pos))) continue

            this.leader.room.errorVisual(member.pos, true)
            this.createMoveRequest(
                {
                    origin: this.leader.pos,
                    goals: this.leader.room.enemyThreatGoals,
                    flee: true,
                },
                /* member, */
            )
            return
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
