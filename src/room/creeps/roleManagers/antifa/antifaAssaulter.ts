import { findClosestObject, getRange, pack } from 'international/generalFunctions'
import { Duo } from './duo'
import { Quad } from './quad'

export class AntifaAssaulter extends Creep {
    /**
     * Tries to find a squad, creating one if none could be found
     */
    findSquad?(): boolean {
        return true
    }

    runSingle?(): void {
        const { room } = this

        // In attackTarget

        if (!this.memory.AR || this.memory.AR === room.name) {
            // rangedAttack

            if (this.memory.squadType === 'rangedAttack') {
                this.advancedRangedAttack()
                return
            }

            // attack

            if (this.memory.squadType === 'attack') {
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
                        pos: new RoomPosition(25, 25, this.memory.AR),
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
                    pos: new RoomPosition(25, 25, this.memory.AR),
                    range: 25,
                },
            ],
        })
    }

    advancedRangedAttack?(): boolean {
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

    advancedAttack?(): void {}

    advancedDismantle?(): void {}

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static antifaAssaulterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: AntifaAssaulter = Game.creeps[creepName]

            // If no squad, try to make or find one

            if (!creep.squad && creep.memory.squadType) {
                if (!creep.findSquad()) continue
            }

            // Quad

            if (creep.squad instanceof Quad) {
                if (creep.name === creep.squad.assaulters[0].name) creep.squad.run()
                continue
            }

            // Duo

            if (creep.squad instanceof Duo) {
                if (creep.name === creep.squad.assaulter.name) creep.squad.run()
                continue
            }

            // Single

            creep.runSingle()
        }
    }
}
