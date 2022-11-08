import { roomDimensions, towerPowers } from 'international/constants'
import { getRange, getRangeOfCoords } from 'international/utils'

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

            if (this._dying !== undefined) return this._dying

            // Stop if creep is spawning

            if (this.spawning) return false

            // If the creep's remaining ticks are more than the estimated spawn time, inform false

            if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

            // Record creep as dying

            return (this._dying = true)
        },
    },
    reservation: {
        get() {
            if (!this.memory.Rs[0]) return false

            return (this._reservation = this.memory.Rs[0])
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

            this._attackStrength = 0

            for (const part of this.body) {
                switch (part.type) {
                    case RANGED_ATTACK:
                        this._attackStrength +=
                            RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                        break
                    case ATTACK:
                        this._attackStrength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                        break
                }
            }

            return this._attackStrength
        },
    },
    healStrength: {
        get() {
            if (this._healStrength) return this._healStrength

            this._healStrength = 0

            for (const part of this.body) {
                if (part.type === HEAL)
                    this._healStrength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
            }

            return this._healStrength
        },
    },
    defenceStrength: {
        get() {
            if (this._defenceStrength) return this._defenceStrength

            if (this.boosts.XGHO2 > 0) return this._defenceStrength = BOOSTS.tough.XGHO2.damage
            else if (this.boosts.GHO2 > 0) return this._defenceStrength = BOOSTS.tough.GHO2.damage
            else if (this.boosts.GO > 0) return this._defenceStrength = BOOSTS.tough.GO.damage

            return 1
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
                if (!tower.RCLActionable) continue
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < TOWER_ENERGY_COST) continue

                let damage = TOWER_POWER_ATTACK

                let range = getRangeOfCoords(this.pos, tower.pos)

                if (range > TOWER_OPTIMAL_RANGE) {
                    if (range > TOWER_FALLOFF_RANGE) range = TOWER_FALLOFF_RANGE

                    damage -=
                        (damage * TOWER_FALLOFF * (range - TOWER_OPTIMAL_RANGE)) /
                        (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
                }

                for (const powerType of towerPowers) {
                    const effect = tower.effectsData.get(powerType) as PowerEffect
                    if (!effect) continue

                    damage *= Math.floor(POWER_INFO[powerType].effect[effect.level - 1])
                }

                this._towerDamage += Math.floor(damage)
            }

            this._towerDamage *= this.defenceStrength

            // The enemy can't heal when we're in safemode, so don't calculate it

            if (room.controller.safeMode) return this._towerDamage

            // Find adjacent creeps

            let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 1), 0)
            let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 1), 0)
            let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 1), 0)
            let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 1), 0)

            // Find adjacent creeps

            const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

            // Loop through each adjacentCreep this creep

            for (const posData of adjacentCreeps) {

                if (this.owner.username !== posData.creep.owner.username) continue

                const range = getRange(this.pos.x, posData.creep.pos.x, this.pos.y, posData.creep.pos.y)
                if (range > 3) continue

                let healStrength = posData.creep.healStrength

                if (range > 1) healStrength / (HEAL_POWER / RANGED_HEAL_POWER)

                this._towerDamage -= healStrength
            }

            return this._towerDamage
        },
    },
    upgradeStrength: {
        get() {

            if (this._upgradeStrength !== undefined) return this._upgradeStrength

            this._upgradeStrength = this.parts.work

            if (this.boosts.XGH2O > 0) return this._upgradeStrength *= BOOSTS.work.XGH2O.upgradeController
            else if (this.boosts.GH2O > 0) return this._defenceStrength *= BOOSTS.upgrade.GH2O.upgradeController
            else if (this.boosts.GH > 0) return this._defenceStrength *= BOOSTS.upgrade.GH.upgradeController

            return this._upgradeStrength
        }
    },
    message: {
        get() {
            if (this._message) return this._message

            this.say(this._message)

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
    },
    canMove: {
        get() {
            if (this._canMove !== undefined) return this._canMove

            return (this._canMove = !this.fatigue && !this.spawning && this.parts.move > 0)
        },
    },
    isOnExit: {
        get() {
            if (this._isOnExit !== undefined) return this._isOnExit

            const { x } = this.pos
            const { y } = this.pos
            return x <= 0 || x >= 49 || y <= 0 || y >= 49
        },
    },
} as PropertyDescriptorMap & ThisType<Creep>)
