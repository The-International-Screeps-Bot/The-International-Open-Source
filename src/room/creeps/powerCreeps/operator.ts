import { ERROR_FAILED, myColors } from 'international/constants'
import { customLog, findObjectWithID, getRangeOfCoords } from 'international/utils'

export class Operator extends PowerCreep {
    constructor(creepID: Id<PowerCreep>) {
        super(creepID)
    }

    preTickManager() {

        this.avoidEnemyThreatCoords()
    }

    endTickManager() {}

    runTask?() {
        if (!this.memory.TN && !this.findTask()) return false

        const taskResult = (this as any)[this.memory.TN]()
        if (!taskResult) return taskResult === ERROR_FAILED

        delete this.memory.TN
        delete this.memory.TTID
        return true
    }

    findTask?() {
        if (this.findRenewTask()) return true
        if (this.findEnablePowerTask()) return true
        if (this.findGenerateOpsTask()) return true
        if (this.findSourceRegenTask()) return true
        return false
    }

    findRenewTask?() {
        if (this.ticksToLive > POWER_CREEP_LIFE_TIME * 0.1) return false

        if (!this.room.powerSpawn) return false

        this.memory.TN = 'advancedRenew'
        return true
    }

    advancedRenew?() {
        const powerSpawn = this.room.powerSpawn
        if (!powerSpawn) return ERROR_FAILED

        const minRange = 1
        if (getRangeOfCoords(this.pos, powerSpawn.pos) > minRange) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: powerSpawn.pos,
                        range: minRange,
                    },
                ],
                avoidEnemyRanges: true,
            })

            return false
        }

        this.renew(powerSpawn)
        return true
    }

    findEnablePowerTask?() {
        const { controller } = this.room
        if (!controller) return false

        if (controller.isPowerEnabled) return false

        this.memory.TN = 'advancedEnablePower'
        return true
    }

    advancedEnablePower?() {
        const { controller } = this.room
        if (!controller) return ERROR_FAILED

        const minRange = 1
        if (getRangeOfCoords(this.pos, controller.pos) > minRange) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: controller.pos,
                        range: minRange,
                    },
                ],
                avoidEnemyRanges: true,
            })

            return false
        }

        this.enableRoom(controller)
        return true
    }

    findGenerateOpsTask?() {
        if (this.powered) return false

        const power = this.powers[PWR_GENERATE_OPS]
        if (!power) return false

        if (power.cooldown) return false

        this.memory.TN = 'advancedGenerateOps'
        return true
    }

    advancedGenerateOps?() {
        this.say('AGO')

        if (this.powered) return false

        this.usePower(PWR_GENERATE_OPS)
        return true
    }

    isViablePowerTarget?(target: Structure | Source) {
        const maxRange = getRangeOfCoords(this.pos, target.pos) * 1.2

        if (this.powers[PWR_REGEN_SOURCE].cooldown > maxRange) return false

        if (!target.effectsData.get(PWR_REGEN_SOURCE)) return true

        if (target.effectsData.get(PWR_REGEN_SOURCE).ticksRemaining > maxRange) return false

        return true
    }

    findSourceRegenTask?() {
        const power = this.powers[PWR_REGEN_SOURCE]
        if (!power) return false

        const sources = this.room.sources.sort((a, b) => {
            return getRangeOfCoords(this.pos, a.pos) - getRangeOfCoords(this.pos, b.pos)
        })

        for (const source of sources) {
            if (!this.isViablePowerTarget(source)) continue

            this.memory.TN = 'advancedRegenSource'
            this.memory.TTID = source.id
            return true
        }

        return false
    }

    advancedRegenSource?() {
        this.say('ARS')

        const source = findObjectWithID(this.memory.TTID)
        if (!source) return true

        this.room.targetVisual(this.pos, source.pos)

        const minRange = 3
        if (getRangeOfCoords(this.pos, source.pos) > minRange) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: source.pos,
                        range: minRange,
                    },
                ],
                avoidEnemyRanges: true,
            })

            return false
        }

        if (this.powered) return false
        if (this.powers[PWR_REGEN_SOURCE].cooldown) return false
        if (source.effectsData.get(PWR_REGEN_SOURCE) && source.effectsData.get(PWR_REGEN_SOURCE).ticksRemaining)
            return false

        this.usePower(PWR_REGEN_SOURCE, source)
        return true
    }

    static operatorManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Operator = Game.powerCreeps[creepName]

            if (creep.runTask()) creep.runTask()
        }
    }
}
