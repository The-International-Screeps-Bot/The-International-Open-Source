import { RESULT_FAIL, myColors, RESULT_NO_ACTION, RESULT_ACTION, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRangeOfCoords } from 'international/utils'

export class Operator extends PowerCreep {
    constructor(creepID: Id<PowerCreep>) {
        super(creepID)
    }

    preTickManager() {
        this.avoidEnemyThreatCoords()
    }

    endTickManager() {}

    // Basic tasks

    runTask?() {

        if (!this.memory.TN && !this.findTask()) return RESULT_FAIL

        const taskResult = (this as any)[this.memory.TN]()
        if (!taskResult) return taskResult === RESULT_FAIL

        delete this.memory.TN

        return RESULT_SUCCESS
    }

    findTask?() {
        if (this.findRenewTask()) return true
        if (this.findEnablePowerTask()) return true
        if (this.findGenerateOpsTask()) return true
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
        if (!powerSpawn) return RESULT_FAIL

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
        if (!controller || controller.isPowerEnabled) return RESULT_NO_ACTION

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

            return RESULT_ACTION
        }

        this.enableRoom(controller)
        return RESULT_SUCCESS
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
        this.powered = true
        return true
    }

    // Complex power tasks

    findPowerTask?() {

        if (this.memory.TTID) {

            const taskTarget = findObjectWithID(this.memory.TTID)
            if (taskTarget) return taskTarget

            delete this.memory.TTID
        }

        let lowestScore = Infinity
        let bestTask: PowerTask

        for (const ID in this.room.powerTasks) {

            const task = this.room.powerTasks[ID]

            // We don't have the requested power

            const power = this.powers[task.powerType]
            if (!power) continue

            // We don't have enough ops for the task

            if ((POWER_INFO[task.powerType] as any).ops > this.store.ops) continue

            const taskTargetPos = findObjectWithID(task.targetID).pos
            const range = getRangeOfCoords(this.pos, taskTargetPos)

            // The target doesn't need us yet or we can't yet provide

            if (Math.max(task.cooldown, power.cooldown) + 5 > range) continue

            let score = task.priority + (range / 100)

            if (score >= lowestScore) continue

            lowestScore = score
            bestTask = task
        }
        customLog('FIND TASK', bestTask)
        if (!bestTask) return RESULT_FAIL

        const taskTarget = findObjectWithID(bestTask.targetID)
        this.memory.PT = bestTask.powerType
        delete this.room.powerTasks[bestTask.taskID]

        return taskTarget
    }

    runPowerTasks?() {

        if (this.runPowerTask() === RESULT_SUCCESS) this.runPowerTask()
    }

    runPowerTask?() {

        const taskTarget = this.findPowerTask()
        if (!taskTarget) return RESULT_FAIL

        taskTarget._reservePowers.add(this.memory.PT)

        // We aren't in range, get closer

        const minRange = (POWER_INFO[this.memory.PT] as any).range
        if (minRange && getRangeOfCoords(this.pos, taskTarget.pos) > minRange) {

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: taskTarget.pos, range: minRange, }]
            })
            return RESULT_ACTION
        }

        // We can't or failed the power

        if (this.powered) return RESULT_FAIL

        const effect = taskTarget.effectsData.get(this.memory.PT)
        if (effect && effect.ticksRemaining > 0) return RESULT_FAIL
        if (this.usePower(this.memory.PT, taskTarget) !== OK) return RESULT_FAIL

        // We did the power

        this.powered = true
        delete this.memory.TTID

        return RESULT_SUCCESS
    }

    static operatorManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Operator = Game.powerCreeps[creepName]

            if (creep.runTask()) continue
            creep.runPowerTasks()
            /* if (creep.runTask()) creep.runTask() */
        }
    }
}
