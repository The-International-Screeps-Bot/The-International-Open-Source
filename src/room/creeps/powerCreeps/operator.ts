import { ERROR_FAILED } from 'international/constants'
import { getRangeOfCoords } from 'international/utils'

export class Operator extends PowerCreep {
    constructor(creepID: Id<PowerCreep>) {
        super(creepID)
    }

    preTickManager() {}

    endTickManager() {}

    runTask?() {
        if (!this.memory.TN && !this.findTask()) return false

        const taskResult = (this as any)[this.memory.TN]()
        if (!taskResult) return taskResult === ERROR_FAILED

        delete this.memory.TN
        return true
    }

    findTask?() {
        if (this.findRenewTask()) return true
        if (this.findEnablePowerTask()) return true
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

        if (getRangeOfCoords(this.pos, powerSpawn.pos) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: powerSpawn.pos,
                        range: 1,
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

        if (getRangeOfCoords(this.pos, controller.pos) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: controller.pos,
                        range: 1,
                    },
                ],
                avoidEnemyRanges: true,
            })

            return false
        }

        this.enableRoom(controller)
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
