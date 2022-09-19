import { myColors, roomDimensions } from 'international/constants'
import { findClosestObject, getRange, pack } from 'international/generalFunctions'
import { Antifa } from './antifa'

export class Duo {
    /**
     * All squad members, where index 0 is the leader
     */
    members: Antifa[]
    leader: Antifa
    expectedSize: 2

    constructor(members: Antifa[]) {
        this.members = members
        this.leader = members[0]
    }
    run() {
        if (this.leader.room.name === this.leader.memory.CRN) {
            // rangedAttack

            if (this.leader.memory.ST === 'rangedAttack') {
                this.advancedRangedAttack()
                return
            }

            // attack

            if (this.leader.memory.ST === 'attack') {
                this.advancedAttack()
                return
            }

            // dismantle

            this.advancedDismantle()
            return
        }

        if (!this.getInFormation()) return

        this.createMoveRequest({
            origin: this.leader.pos,
            goals: [
                {
                    pos: new RoomPosition(25, 25, this.leader.memory.CRN),
                    range: 25,
                },
            ],
        })
    }
    getInFormation() {
        if (this.leader.spawning) return false

        if (this.leader.isOnExit()) return true

        if (getRange(this.leader.pos.x, this.members[1].pos.x, this.leader.pos.y, this.members[1].pos.y) === 1)
            return true

        this.members[1].createMoveRequest({
            origin: this.members[1].pos,
            goals: [
                {
                    pos: this.leader.pos,
                    range: 1,
                },
            ],
        })
        return false
    }
    createMoveRequest(opts: MoveRequestOpts) {
        if (this.members[1].fatigue > 0 || this.members[1].spawning) return

        if (!this.leader.createMoveRequest(opts)) return

        // Make a moveRequest for the member to the leader

        const packedCoord = pack(this.leader.pos)

        this.members[1].moveRequest = packedCoord

        this.members[1].room.moveRequests.get(packedCoord)
        ? this.members[1].room.moveRequests.get(packedCoord).push(this.members[1].name)
        : this.members[1].room.moveRequests.set(packedCoord, [this.members[1].name])
    }
    advancedRangedAttack() {
        const { room } = this.leader

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        // If there are none

        if (!enemyAttackers.length) {
            const enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            if (!enemyCreeps.length) {
                return this.leader.aggressiveHeal()
            }

            // Heal nearby creeps

            if (this.leader.passiveHeal()) return true

            this.leader.say('EC')

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals) this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

            // Get the range between the creeps

            const range = getRange(this.leader.pos.x, enemyCreep.pos.x, this.leader.pos.y, enemyCreep.pos.y)

            // If the range is more than 1

            if (range > 1) {
                this.leader.rangedAttack(enemyCreep)

                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.leader.rangedMassAttack()

            if (this.leader.canMove && this.members[1].canMove) {
                this.leader.moveRequest = pack(enemyCreep.pos)
                this.members[1].moveRequest = pack(this.leader.pos)
            }

            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.leader.pos, enemyAttackers)
        if (Memory.roomVisuals) this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, { color: myColors.green, opacity: 0.3 })

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

        // Otherwise, have the creep pre-heal itself

        this.leader.heal(this.leader)

        // If the range is 1, rangedMassAttack

        if (range === 1) {
            this.leader.rangedMassAttack()
            this.leader.moveRequest = pack(enemyAttacker.pos)
        }

        // Otherwise, rangedAttack the enemyAttacker
        else this.leader.rangedAttack(enemyAttacker)

        // If the creep is out matched, try to always stay in range 3

        if (this.leader.healStrength < enemyAttacker.attackStrength) {
            if (range === 3) return true

            if (range >= 3) {
                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 3 }],
                })

                return true
            }

            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 25 }],
                flee: true,
            })

            return true
        }

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.leader.healStrength < enemyAttacker.attackStrength) {
            // If the range is less or equal to 2

            if (range <= 2) {
                // Have the creep flee and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                })

                return true
            }
        }

        // If the range is more than 1

        if (range > 1) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        // Otherwise inform true

        return true
    }
    advancedAttack() {
        const { room } = this.leader

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        // If there are none

        if (!enemyAttackers.length) {
            const enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            if (!enemyCreeps.length) return false

            this.leader.say('EC')

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals) this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

            // If the range is more than 1

            if (getRange(this.leader.pos.x, enemyCreep.pos.x, this.leader.pos.y, enemyCreep.pos.y) > 1) {
                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            if (this.leader.canMove && this.members[1].canMove) {
                this.leader.moveRequest = pack(enemyCreep.pos)
                this.members[1].moveRequest = pack(this.leader.pos)
            }
            return true
        }

        const enemyAttacker = findClosestObject(this.leader.pos, enemyAttackers)
        if (Memory.roomVisuals) this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, { color: myColors.green, opacity: 0.3 })

        // If the range is more than 1

        if (getRange(this.leader.pos.x, enemyAttacker.pos.x, this.leader.pos.y, enemyAttacker.pos.y) > 1) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        this.leader.attack(enemyAttacker)
        return true
    }
    advancedDismantle() {
        // Avoid targets we can't dismantle

        const structures = this.leader.room.find(FIND_STRUCTURES, {
            filter: structure =>
                structure.structureType != STRUCTURE_CONTROLLER && structure.structureType != STRUCTURE_INVADER_CORE,
        })

        if (!structures.length) return

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals) this.leader.room.visual.line(this.leader.pos, structure.pos, { color: myColors.green, opacity: 0.3 })

        if (getRange(this.leader.pos.x, structure.pos.y, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        if (this.leader.dismantle(structure) !== OK) return

        // See if the structure is destroyed next tick

        structure.realHits = structure.hits - this.leader.parts.work * DISMANTLE_POWER
        if (structure.realHits > 0) return

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return

        structure = findClosestObject(this.leader.pos, structures)

        if (getRange(this.leader.pos.x, structure.pos.y, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }
    }
    advancedHeal() {
        if (this.members[1].hits < this.members[1].hitsMax) {
            this.members[1].heal(this.members[1])
            return
        }

        // If there are no attackers, only heal the leader if it's damaged

        if (!this.leader.room.enemyAttackers.length) {
            if (this.leader.hits < this.leader.hitsMax) this.members[1].heal(this.leader)
            return
        }

        this.members[1].heal(this.leader)
    }
}
