import { allowedSquadCombinations } from 'international/constants'
import { customLog, findClosestObject, getRange, pack } from 'international/generalFunctions'
import { Duo } from './duo'
import { Quad } from './quad'

export class Antifa extends Creep {
    preTickManager() {
        if (!this.memory.SS) return

        const squadMembers: Creep[] = [this]

        if (this.memory.SMNs) {
            for (let i = 0; i < this.memory.SMNs.length; i++) {
                const creep = Game.creeps[this.memory.SMNs[i]]

                if (!creep) {
                    this.memory.SMNs.splice(i, 1)
                    break
                }

                squadMembers.push(creep)
            }

            if (this.memory.SMNs.length === this.memory.SS) {

                if (this.memory.SS === 2) {
                    this.squad = new Duo(squadMembers)
                    return
                }

                this.squad = new Quad(squadMembers)
                return
            }
        }

        // The creep didn't have enough members to form a squad, so make a request

        this.memory.SMNs = [this.name]
        this.room.squadRequests.add(this.name)
    }

    runSquad?() {

        // The creep should be single

        if (!this.memory.SS) return false

        // The creep is in a squad but no the leader

        if (!this.squad && this.memory.SMNs.length === this.memory.SS) return true

        if (!this.createSquad()) return true

        this.squad.run()
        return true
    }

    /**
     * Tries to find a squad, creating one if none could be found
     */
    createSquad?() {

        for (const requestingCreepName of this.room.squadRequests) {

            if (requestingCreepName === this.name) continue

            const requestingCreep = Game.creeps[requestingCreepName]

            if (this.memory.ST !== requestingCreep.memory.ST) continue

            // If the creep is allowed to join the other creep

            if (!allowedSquadCombinations[this.memory.SS][this.role].has(requestingCreep.role)) continue

            this.memory.SMNs.push(requestingCreepName)

            if (this.memory.SMNs.length === this.memory.SS) break
        }

        if (this.memory.SMNs.length !== this.memory.SS) return false

        const squadMembers: Creep[] = []

        for (const squadCreepName of this.memory.SMNs) {

            this.room.squadRequests.delete(squadCreepName)

            const squadCreep = Game.creeps[squadCreepName]

            squadCreep.memory.SMNs = this.memory.SMNs
            squadMembers.push(squadCreep)
        }

        if (this.memory.SS === 2) {
            this.squad = new Duo(squadMembers)
            return true
        }

        this.squad = new Quad(squadMembers)
        return true
    }

    runSingle?() {
        const { room } = this

        // In attackTarget

        if (this.memory.CRN === room.name) {
            // rangedAttack

            if (this.memory.ST === 'rangedAttack') {
                this.advancedRangedAttack()
                return
            }

            // attack

            if (this.memory.ST === 'attack') {
                this.advancedAttack()
                return
            }

            // dismantle

            this.advancedDismantle()
            return
        }

        this.passiveRangedAttack()
        this.passiveHeal()

        // In the commune

        if (this.commune?.name === this.name) {
            // Go to the attackTarget

            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, this.memory.CRN),
                        range: 25,
                    },
                ],
            })
            return
        }

        // In a non-attackTarget or commune room

        // Go to the attackTarget

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: new RoomPosition(25, 25, this.memory.CRN),
                    range: 25,
                },
            ],
        })
    }

    advancedRangedAttack?() {
        const { room } = this

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        // If there are none

        if (!enemyAttackers.length) {
            const enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            if (!enemyCreeps.length) {
                return this.aggressiveHeal()
            }

            // Heal nearby creeps

            if (this.passiveHeal()) return true

            this.say('EC')

            const enemyCreep = findClosestObject(this.pos, enemyCreeps)
            // Get the range between the creeps

            const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y)

            // If the range is more than 1

            if (range > 1) {
                this.rangedAttack(enemyCreep)

                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.rangedMassAttack()
            this.moveRequest = pack(enemyCreep.pos)

            return true
        }

        // Otherwise, get the closest enemyAttacker

        const enemyAttacker = findClosestObject(this.pos, enemyAttackers)

        // Get the range between the creeps

        const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y)

        // If it's more than range 3

        if (range > 3) {
            // Heal nearby creeps

            this.passiveHeal()

            // Make a moveRequest to it and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        this.say('AEA')

        // Otherwise, have the creep pre-heal itself

        this.heal(this)

        // If the range is 1, rangedMassAttack

        if (range === 1) {
            this.rangedMassAttack()
            this.moveRequest = pack(enemyAttacker.pos)
        }

        // Otherwise, rangedAttack the enemyAttacker
        else this.rangedAttack(enemyAttacker)

        // If the creep is out matched, try to always stay in range 3

        if (this.healStrength < enemyAttacker.attackStrength) {
            if (range === 3) return true

            if (range >= 3) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyAttacker.pos, range: 3 }],
                })

                return true
            }

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 25 }],
                flee: true,
            })

            return true
        }

        // If the creep has less heal power than the enemyAttacker's attack power

        if (this.healStrength < enemyAttacker.attackStrength) {
            // If the range is less or equal to 2

            if (range <= 2) {
                // Have the creep flee and inform true

                this.createMoveRequest({
                    origin: this.pos,
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
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        // Otherwise inform true

        return true
    }

    advancedAttack?() {
        const { room } = this

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit()
        })

        // If there are none

        if (!enemyAttackers.length) {
            const enemyCreeps = room.enemyCreeps.filter(function (creep) {
                return !creep.isOnExit()
            })

            this.say('EC')

            const enemyCreep = findClosestObject(this.pos, enemyCreeps)

            // If the range is more than 1

            if (getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y) > 1) {
                // Have the create a moveRequest to the enemyAttacker and inform true

                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: enemyCreep.pos, range: 1 }],
                })

                return true
            }

            this.moveRequest = pack(enemyCreep.pos)
            return true
        }

        const enemyAttacker = findClosestObject(this.pos, enemyAttackers)

        // If the range is more than 1

        if (getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y) > 1) {
            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: enemyAttacker.pos, range: 1 }],
            })

            return true
        }

        // Otherwise attack

        this.attack(enemyAttacker)
        return true
    }

    advancedDismantle?() {

        // Avoid targets we can't dismantle

        const structures = this.room.find(FIND_STRUCTURES, {
            filter: structure => structure.structureType != STRUCTURE_CONTROLLER && structure.structureType != STRUCTURE_INVADER_CORE
        })

        if (!structures) return

        let structure = findClosestObject(this.pos, structures)

        if (getRange(this.pos.x, structure.pos.y, this.pos.y, structure.pos.y) > 1) {

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }

        if (this.dismantle(structure) !== OK) return

        // See if the structure is destroyed next tick

        structure.realHits = structure.hits - this.parts.work * DISMANTLE_POWER
        if (structure.realHits > 0) return

        // Try to find a new structure to preemptively move to

        structures.splice(structures.indexOf(structure), 1)

        structure = findClosestObject(this.pos, structures)

        if (getRange(this.pos.x, structure.pos.y, this.pos.y, structure.pos.y) > 1) {

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: structure.pos, range: 1 }],
            })
        }
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static antifaManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Antifa = Game.creeps[creepName]

            if (!creep.runSquad()) creep.runSingle()
        }
    }
}
