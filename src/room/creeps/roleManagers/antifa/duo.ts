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

    constructor(members: Antifa[]) {
        this.members = members
        this.leader = members[0]
    }

    run() {
        this.leader.say('Hi')

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

        if (getRange(this.leader.pos.x, this.members[1].pos.x, this.leader.pos.y, this.members[1].pos.y) <= 1)
            return true

        this.leader.say('GIF')

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

    createMoveRequest(opts: MoveRequestOpts, moveLeader = this.leader) {
        for (const member of this.members) if (!member.canMove) return

        if (!moveLeader.createMoveRequest(opts)) return

        // Make a moveRequest for the member to the leader

        const packedCoord = pack(moveLeader.pos)

        for (const member of this.members) {
            if (member.name === moveLeader.name) continue

            member.moveRequest = packedCoord

            member.room.moveRequests.get(packedCoord)
                ? member.room.moveRequests.get(packedCoord).push(member.name)
                : member.room.moveRequests.set(packedCoord, [member.name])
        }
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
                this.leader.assignMoveRequest(enemyCreep.pos)
                this.members[1].assignMoveRequest(this.leader.pos)
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
            if (this.leader.canMove && this.members[1].canMove) {
                this.leader.assignMoveRequest(enemyAttacker.pos)
                this.members[1].assignMoveRequest(this.leader.pos)
            }
        }

        // Otherwise, rangedAttack the enemyAttacker
        else this.leader.rangedAttack(enemyAttacker)

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.leader.healStrength < enemyAttacker.attackStrength) {
            // If the range is less or equal to 2

            if (range <= 2) {
                // Have the creep flee and inform true

                this.createMoveRequest({
                    origin: this.leader.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 1 }],
                    flee: true,
                }, this.members[1])

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

            this.leader.attack(enemyCreep)

            if (this.leader.canMove && this.members[1].canMove) {
                this.leader.assignMoveRequest(enemyCreep.pos)
                this.members[1].assignMoveRequest(this.leader.pos)
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

        if (this.leader.canMove && this.members[1].canMove) {
            this.leader.assignMoveRequest(enemyAttacker.pos)
            this.members[1].assignMoveRequest(this.leader.pos)
        }
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
