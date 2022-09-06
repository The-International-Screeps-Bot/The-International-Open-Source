import { allyList, roomDimensions } from 'international/constants'
import { getRange } from 'international/generalFunctions'

Object.defineProperties(Creep.prototype, {
    role: {
        get() {
            if (this._role) return this._role

            return (this._role = this.name.split(' ')[0] as CreepRoles)
        },
    },
    cost: {
        get() {
            if (this._cost) return this._cost

            return (this._cost = parseInt(this.name.split(' ')[1]))
        },
    },
    commune: {
        get() {
            if (this._commune) return this._commune

            return (this._commune = Game.rooms[this.name.split(' ')[2]])
        },
    },
    dying: {
        get() {
            // Inform as dying if creep is already recorded as dying

            if (this._dying) return true

            // Stop if creep is spawning

            if (!this.ticksToLive) return false

            // If the creep's remaining ticks are more than the estimated spawn time, inform false

            if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

            // Record creep as dying

            return (this._dying = true)
        },
    },
    reservation: {
        get() {
            if (!this.memory.reservations[0]) return false

            return (this._reservation = this.memory.reservations[0])
        },
    },
    strength: {
        get() {
            if (this._strength) return this._strength

            this._strength = 1

            for (const part of this.body) {
                switch (part.type) {
                    case RANGED_ATTACK:
                        this._strength +=
                            RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                        break
                    case ATTACK:
                        this._strength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                        break
                    case HEAL:
                        this._strength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
                        break
                    case TOUGH:
                        this._strength += 1 + 5 / (part.boost ? BOOSTS[part.type][part.boost].damage : 1)
                        break
                    default:
                        this._strength += 1
                }
            }

            return this._strength
        },
    },
    attackStrength: {
        get() {
            if (this._attackStrength) return this._attackStrength

            this._attackStrength = 1

            for (const part of this.body) {
                switch (part.type) {
                    case RANGED_ATTACK:
                        this._attackStrength +=
                            RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                        break
                    case ATTACK:
                        this._attackStrength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                        break
                    default:
                        this._attackStrength += 1
                }
            }

            return this._attackStrength
        },
    },
    healStrength: {
        get() {
            if (this._healStrength) return this._healStrength

            this._healStrength = 0

            let toughBoost = 0

            for (const part of this.body) {
                if (part.type === TOUGH) {
                    toughBoost = Math.max(part.boost ? BOOSTS[part.type][part.boost].damage : 0, toughBoost)
                    continue
                }

                if (part.type === HEAL)
                    this._healStrength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
            }

            return (this._healStrength += this._healStrength * toughBoost)
        },
    },
    parts: {
        get() {
            if (this._parts) return this._parts

            this._parts = {}

            for (const partType of BODYPARTS_ALL) this._parts[partType] = 0

            for (const part of this.body) this._parts[part.type] += 1

            return this._parts
        },
    },
    boosts: {
        get() {
            if (this._boosts) return this._boosts

            this._boosts = {}

            let boost

            for (const part of this.body) {
                boost = part.boost as MineralBoostConstant
                if (!boost) continue

                this._boosts[boost] ? (this._boosts[boost] += 1) : (this._boosts[boost] = 1)
            }

            return this._boosts
        },
    },
    towerDamage: {
        get() {
            if (this._towerDamage) return this._towerDamage

            const { room } = this

            this._towerDamage = 0

            for (const tower of room.structures.tower) {
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) continue

                const range = getRange(this.pos.x, tower.pos.x, this.pos.y, tower.pos.y)

                if (range <= TOWER_OPTIMAL_RANGE) {
                    this._towerDamage += TOWER_POWER_ATTACK
                    continue
                }

                const factor =
                    range < TOWER_FALLOFF_RANGE
                        ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
                        : 1
                this._towerDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor))
            }

            // Find adjacent creeps

            let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 1), 0)
            let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 1), 0)
            let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 1), 0)
            let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 1), 0)

            // Find adjacent creeps

            const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

            // Loop through each adjacentCreep

            for (const posData of adjacentCreeps) {
                // If the creep is not owned and isn't an ally

                if (posData.creep.my || Memory.allyList.includes(posData.creep.owner.username)) continue

                const range = getRange(this.pos.x, posData.creep.pos.x, this.pos.y, posData.creep.pos.y)

                if (range > 3) continue

                this._towerDamage -= posData.creep.findTotalHealPower(range)
            }

            if (this.boosts.XGHO2 > 0) this._towerDamage *= BOOSTS.tough.XGHO2.damage
            else if (this.boosts.GHO2 > 0) this._towerDamage *= BOOSTS.tough.GHO2.damage
            else if (this.boosts.GO > 0) this._towerDamage *= BOOSTS.tough.GO.damage

            return this._towerDamage
        },
    },
    message: {
        get() {
            if (this._message) return this._message

            return (this._message = '')
        },
        set(newMessage) {
            this._message = newMessage
        },
    },
    freeCapacityNextTick: {
        get() {
            if (this._freeCapacityNextTick !== undefined) return this._freeCapacityNextTick

            return (this._freeCapacityNextTick = this.store.getFreeCapacity())
        },
        set(newFreeCapacityNextNext) {
            this._freeCapacityNextTick = newFreeCapacityNextNext
        },
    }
} as PropertyDescriptorMap & ThisType<Creep>)
