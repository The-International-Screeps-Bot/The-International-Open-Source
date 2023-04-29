import {
    CreepMemoryKeys,
    creepRoles,
    dismantleBoosts,
    dismantleBoostsSet,
    roomDimensions,
    towerPowers,
} from 'international/constants'
import { customLog, estimateTowerDamage, getRangeXY, getRange, isXYExit } from 'international/utils'
import { profiler } from 'other/profiler'

Object.defineProperties(Creep.prototype, {
    nameData: {
        get() {
            if (this._nameData) return this._nameData

            return (this._nameData = this.name.split('_'))
        },
    },
    role: {
        get() {
            if (this._role) return this._role

            return (this._role = creepRoles[parseInt(this.nameData[0])])
        },
    },
    cost: {
        get() {
            if (this._cost) return this._cost

            return (this._cost = parseInt(this.nameData[1]))
        },
    },
    commune: {
        get() {
            if (this._commune) return this._commune

            return (this._commune = Game.rooms[this.nameData[2]])
        },
    },
    defaultParts: {
        get() {
            if (this._defaultParts) return this._defaultParts

            return (this._defaultParts = parseInt(this.nameData[3]))
        },
    },
    customID: {
        get() {
            if (this._customID) return this._customID

            return (this._customID = parseInt(this.nameData[4]))
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
    macroHealStrength: {
        get() {
            if (this._macroHealStrength !== undefined) return this._macroHealStrength

            this._macroHealStrength = this.combatStrength.heal

            // Find adjacent creeps

            let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 1), 0)
            let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 1), 0)
            let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 1), 0)
            let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 1), 0)

            const adjacentCreeps = this.room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

            // Calculate combined heal to this creep of adjacent creeps

            for (const posData of adjacentCreeps) {
                const { creep } = posData

                if (this.owner.username === Memory.me) {
                    if (creep.owner.username !== Memory.me) continue
                } else if (this.owner.username !== creep.owner.username) continue

                const range = getRange(this.pos, creep.pos)
                if (range > 3) continue

                let healStrength = creep.combatStrength.heal
                if (range > 1) healStrength /= HEAL_POWER / RANGED_HEAL_POWER

                this._macroHealStrength += Math.floor(healStrength)
            }

            return this._macroHealStrength
        },
    },
    netTowerDamage: {
        get() {
            if (this._netTowerDamage !== undefined) return this._netTowerDamage

            this._netTowerDamage = this.grossTowerDamage
            this._netTowerDamage *= this.defenceStrength

            // The enemy can't heal when we're in safemode, so don't calculate it

            if (this.room.controller.safeMode) return this._netTowerDamage

            this._netTowerDamage -= this.macroHealStrength

            return this._netTowerDamage
        },
    },
    upgradeStrength: {
        get() {
            if (this._upgradeStrength !== undefined) return this._upgradeStrength

            this._upgradeStrength = this.parts.work

            if (this.boosts.XGH2O > 0) return (this._upgradeStrength *= BOOSTS.work.XGH2O.upgradeController)
            else if (this.boosts.GH2O > 0) return (this._upgradeStrength *= BOOSTS.upgrade.GH2O.upgradeController)
            else if (this.boosts.GH > 0) return (this._upgradeStrength *= BOOSTS.upgrade.GH.upgradeController)

            return this._upgradeStrength
        },
    },
    combatStrength: {
        get() {
            if (this._combatStrength) return this._combatStrength

            this._combatStrength = {
                dismantle: 0,
                melee: 0,
                ranged: 0,
                heal: 0,
            }

            for (const part of this.body) {
                if (part.type === WORK) {
                    const boost = part.boost as
                        | RESOURCE_CATALYZED_ZYNTHIUM_ACID
                        | RESOURCE_ZYNTHIUM_ACID
                        | RESOURCE_ZYNTHIUM_HYDRIDE

                    this._combatStrength.dismantle +=
                        DISMANTLE_POWER *
                        (part.boost && dismantleBoosts.includes(boost) ? BOOSTS[part.type][boost].dismantle : 1)
                    continue
                }

                if (part.type === ATTACK) {
                    this._combatStrength.melee += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                    continue
                }

                if (part.type === RANGED_ATTACK) {
                    this._combatStrength.ranged +=
                        RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                    continue
                }

                if (part.type === HEAL) {
                    this._combatStrength.heal += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
                }
            }

            return this._combatStrength
        },
    },
    defenceStrength: {
        get() {
            if (this._defenceStrength) return this._defenceStrength

            if (this.boosts.XGHO2 > 0) return (this._defenceStrength = BOOSTS.tough.XGHO2.damage)
            else if (this.boosts.GHO2 > 0) return (this._defenceStrength = BOOSTS.tough.GHO2.damage)
            else if (this.boosts.GO > 0) return (this._defenceStrength = BOOSTS.tough.GO.damage)

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
    canMove: {
        get() {
            if (this._canMove !== undefined) return this._canMove

            return (this._canMove = !this.fatigue && !this.spawning && this.parts.move > 0)
        },
    },
    idealSquadMembers: {
        get() {
            if (this._idealSquadMembers) return this._idealSquadMembers

            if (this.memory[CreepMemoryKeys.squadSize] === 2) {
            }

            if (this.memory[CreepMemoryKeys.squadSize] === 4) {
            }

            // Dynamic

            return this._idealSquadMembers
        },
    },
} as PropertyDescriptorMap & ThisType<Creep>)

Object.defineProperties(PowerCreep.prototype, {
    macroHealStrength: {
        get() {
            if (this._macroHealStrength !== undefined) return this._macroHealStrength

            this._macroHealStrength = 0

            // Find adjacent creeps

            let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 1), 0)
            let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 1), 0)
            let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 1), 0)
            let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 1), 0)

            // Find adjacent creeps

            const adjacentCreeps = this.room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

            // Loop through each adjacentCreep this creep

            for (const posData of adjacentCreeps) {
                const { creep } = posData

                if (this.owner.username === Memory.me) {
                    if (creep.owner.username !== Memory.me) continue
                } else if (this.owner.username !== creep.owner.username) continue

                const range = getRange(this.pos, creep.pos)
                if (range > 3) continue

                let healStrength = creep.combatStrength.heal
                if (range > 1) healStrength /= HEAL_POWER / RANGED_HEAL_POWER

                this._macroHealStrength += Math.floor(healStrength)
            }

            return this._macroHealStrength
        },
    },
    netTowerDamage: {
        get() {
            if (this._netTowerDamage !== undefined) return this._netTowerDamage

            this._netTowerDamage = this.grossTowerDamage

            // The enemy can't heal when we're in safemode, so don't calculate it

            if (this.room.controller.safeMode) return this._netTowerDamage

            this._netTowerDamage -= this.macroHealStrength

            return this._netTowerDamage
        },
    },
    powerCooldowns: {
        get() {
            if (this._powerCooldowns) return this._powerCooldowns

            this._powerCooldowns = new Map()

            for (const powerType in this.powers) {
                const cooldown = this.powers[powerType].cooldown
                if (!cooldown) continue

                this._powerCooldowns.set(parseInt(powerType) as PowerConstant, cooldown)
            }

            return this._powerCooldowns
        },
    },
} as PropertyDescriptorMap & ThisType<PowerCreep>)

const additions = {
    reserveHits: {
        get() {
            if (this._reserveHits !== undefined) return this._reserveHits

            return (this._reserveHits = this.hits + this.macroHealStrength)
        },
        set(newHits) {
            this._reserveHits = newHits
        },
    },
    grossTowerDamage: {
        get() {
            if (this._grossTowerDamage !== undefined) return this._grossTowerDamage

            this._grossTowerDamage = 0

            for (const tower of this.room.roomManager.structures.tower) {
                if (!tower.RCLActionable) continue
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < TOWER_ENERGY_COST) continue

                this._grossTowerDamage = tower.estimateDamageGross(this.pos)
            }

            return this._grossTowerDamage
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
    },
    isOnExit: {
        get() {
            if (this._isOnExit !== undefined) return this._isOnExit

            const { x } = this.pos
            const { y } = this.pos
            return isXYExit(x, y)
        },
    },
    exitTo: {
        get() {
            if (this._exitTo !== undefined) return this._exitTo

            if (!this.isOnExit) return (this._exitTo = false)

            const exits = Game.map.describeExits(this.room.name)
            if (this.pos.y === 0) return (this._exitTo = exits[TOP])
            if (this.pos.x === 0) return (this._exitTo = exits[LEFT])
            if (this.pos.y === roomDimensions - 1) return (this._exitTo = exits[BOTTOM])
            return (this._exitTo = exits[RIGHT])
        },
    },
} as PropertyDescriptorMap & (ThisType<Creep> | ThisType<PowerCreep>)

/* profiler.registerObject(additions, 'creepAdditions') */

Object.defineProperties(Creep.prototype, additions)
Object.defineProperties(PowerCreep.prototype, additions)
