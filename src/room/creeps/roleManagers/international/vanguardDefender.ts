import { allyList, ClaimRequestNeeds } from 'international/constants'
import { findClosestObject, getRange, pack } from 'international/generalFunctions'

export class VanguardDefender extends Creep {
    /**
     * Find and attack enemyCreeps
     */
    advancedAttackEnemies?(): boolean {
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

        const enemyAttacker = findClosestObject(this.pos, room.enemyAttackers)

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

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static vanguardDefenderManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: VanguardDefender = Game.creeps[creepName]

            const claimTarget = Memory.rooms[creep.commune.name].claimRequest

            // If the creep has no claim target, stop

            if (!claimTarget) return

            Memory.claimRequests[Memory.rooms[creep.commune.name].claimRequest].needs[
                ClaimRequestNeeds.vanguardDefender
            ] -= creep.strength

            creep.say(claimTarget)

            if (room.name === claimTarget) {
                if (creep.advancedAttackEnemies()) continue

                continue
            }

            // Otherwise if the creep is not in the claimTarget

            // Move to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: new RoomPosition(25, 25, claimTarget), range: 25 }],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    commune: 1,
                    neutral: 1,
                    highway: 1,
                },
            })
        }
    }
}
