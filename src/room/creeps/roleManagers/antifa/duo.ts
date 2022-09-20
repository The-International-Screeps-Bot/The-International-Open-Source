import { myColors, roomDimensions } from 'international/constants'
import { findClosestObject, getRange, isExit, pack } from 'international/generalFunctions'
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
            this.getInFormation()

            if (this.runCombat()) return

            this.stompEnemyCSites()
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
    runCombat() {
        this.advancedHeal()
        if (this.leader.memory.ST === 'rangedAttack') return this.advancedRangedAttack()
        if (this.leader.memory.ST === 'attack') return this.advancedAttack()
        return this.advancedDismantle()
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
                if (this.leader.aggressiveHeal()) return true
                return this.rangedAttackStructures()
            }

            // Heal nearby creeps

            if (this.leader.passiveHeal()) return true

            this.leader.say('EC')

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

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
    rangedAttackStructures() {
        const structures = this.leader.room.dismantleableStructures

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
    advancedAttack() {
        const { room } = this.leader

        let enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        if (!enemyAttackers.length) enemyAttackers = room.enemyAttackers

        // If there are none

        if (!enemyAttackers.length) {
            let enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            if (!enemyCreeps.length) enemyCreeps = room.enemyCreeps

            if (!enemyCreeps.length) return this.attackStructures()

            this.leader.say('EC')

            const enemyCreep = findClosestObject(this.leader.pos, enemyCreeps)
            if (Memory.roomVisuals)
                this.leader.room.visual.line(this.leader.pos, enemyCreep.pos, { color: myColors.green, opacity: 0.3 })

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
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, enemyAttacker.pos, { color: myColors.green, opacity: 0.3 })

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
    attackStructures() {
        const structures = this.leader.room.dismantleableStructures

        if (!structures.length) return false

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, structure.pos, { color: myColors.green, opacity: 0.3 })

        if (getRange(this.leader.pos.x, structure.pos.x, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })

            return false
        }

        if (this.leader.attack(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.realHits = structure.hits - this.leader.parts.attack * ATTACK_POWER
        if (structure.realHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.leader.pos, structures)

        if (getRange(this.leader.pos.x, structure.pos.y, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        return true
    }
    advancedDismantle() {
        // Avoid targets we can't dismantle

        const structures = this.leader.room.dismantleableStructures

        if (!structures.length) return false

        let structure = findClosestObject(this.leader.pos, structures)
        if (Memory.roomVisuals)
            this.leader.room.visual.line(this.leader.pos, structure.pos, { color: myColors.green, opacity: 0.3 })

        if (getRange(this.leader.pos.x, structure.pos.x, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })

            return true
        }

        if (this.leader.dismantle(structure) !== OK) return false

        // See if the structure is destroyed next tick

        structure.realHits = structure.hits - this.leader.parts.work * DISMANTLE_POWER
        if (structure.realHits > 0) return true

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)
        if (!structures.length) return true

        structure = findClosestObject(this.leader.pos, structures)

        if (getRange(this.leader.pos.x, structure.pos.y, this.leader.pos.y, structure.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.leader.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        return true
    }
    stompEnemyCSites?() {
        if (this.leader.room.controller && this.leader.room.controller.safeMode) return false

        // Filter only enemy construction sites worth stomping

        const enemyCSites = this.leader.room.enemyCSites.filter(
            cSite => cSite.progress > 0 && !isExit(cSite.pos.x, cSite.pos.y),
        )

        if (!enemyCSites.length) return false

        const enemyCSite = findClosestObject(this.leader.pos, enemyCSites)

        this.createMoveRequest({
            origin: this.leader.pos,
            goals: [{ pos: enemyCSite.pos, range: 0 }],
        })

        return true
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
