import { allyList } from 'international/constants'
import { getRange } from 'international/generalFunctions'

Object.defineProperties(Creep.prototype, {
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

            for (const part of this.body) {
                this._parts[part.type] ? (this._parts[part.type] += 1) : (this._parts[part.type] = 1)
            }

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
            let range
            let factor

            for (const tower of room.structures.tower) {
                if (tower.store.energy <= 0) continue

                range = getRange(this.pos.x, tower.pos.x, this.pos.y, tower.pos.y)

                if (range <= TOWER_OPTIMAL_RANGE) {
                    this._towerDamage += TOWER_POWER_ATTACK
                    continue
                }

                factor =
                    range < TOWER_FALLOFF_RANGE
                        ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
                        : 1
                this._towerDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor))
            }

            // Find adjacent creeps

            const adjacentCreeps = room.lookForAtArea(
                LOOK_CREEPS,
                Math.max(Math.min(this.pos.y - 3, -2), 2),
                Math.max(Math.min(this.pos.x - 3, -2), 2),
                Math.max(Math.min(this.pos.y + 3, -2), 2),
                Math.max(Math.min(this.pos.x + 3, -2), 2),
                true,
            )

            // Loop through each adjacentCreep

            for (const posData of adjacentCreeps) {
                // If the creep is not owned and isn't an ally

                if (posData.creep.my || Memory.allyList.includes(posData.creep.owner.username)) continue

                range = getRange(this.pos.x, posData.creep.pos.x, this.pos.y, posData.creep.pos.y)

                if (range > 3) continue

                this._towerDamage -= posData.creep.findTotalHealPower(range)
            }

            if (this.boosts.GO > 0) this._towerDamage *= BOOSTS.tough.GO.damage
            if (this.boosts.GHO2 > 0) this._towerDamage *= BOOSTS.tough.GHO2.damage
            if (this.boosts.XGHO2 > 0) this._towerDamage *= BOOSTS.tough.XGHO2.damage

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
} as PropertyDescriptorMap & ThisType<Creep>)
