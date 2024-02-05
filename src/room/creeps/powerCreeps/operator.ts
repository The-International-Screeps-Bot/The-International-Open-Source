import {
  Result,
  customColors,
  CreepMemoryKeys,
  CreepPowerTaskKeys,
  CreepTaskKeys,
  CreepTaskNames,
} from '../../../constants/general'
import { CommuneUtils } from 'room/commune/communeUtils'
import { CreepPowerTask, PowerRequest } from 'types/creepTasks'
import { LogOps } from 'utils/logOps'
import { findObjectWithID, getRange } from 'utils/utils'

export class Operator extends PowerCreep {
  constructor(creepID: Id<PowerCreep>) {
    super(creepID)
  }

  initRun() {
    this.managePowerTask()
    this.avoidEnemyThreatCoords()
  }

  managePowerTask?() {
    const creepMemory = Memory.powerCreeps[this.name]
    const task = creepMemory[CreepMemoryKeys.powerTask]
    if (!task) return

    const taskTarget = findObjectWithID(task[CreepPowerTaskKeys.target])
    if (!taskTarget) {
      delete creepMemory[CreepMemoryKeys.task]
      return
    }

    // Don't have the taskTarget thinking it needs a new task

    taskTarget.reservePowers
    taskTarget._reservePowers.add(task[CreepPowerTaskKeys.power])
  }

  endRun() {}

  // Basic tasks

  runTask?() {
    const creepMemory = Memory.powerCreeps[this.name]
    if (!creepMemory[CreepMemoryKeys.task] && !this.findTask()) {
      return Result.fail
    }

    const taskResult = (this as any)[creepMemory[CreepMemoryKeys.task][CreepTaskKeys.taskName]]()
    if (!taskResult) return taskResult === Result.fail

    delete creepMemory[CreepMemoryKeys.task]
    return Result.success
  }

  findTask?() {
    if (this.findRenewTask()) return true
    if (this.findEnablePowerTask()) return true
    if (this.findGenerateOpsTask()) return true
    if (this.findTransferOpsTask()) return true
    return false
  }

  findRenewTask?() {
    if (this.ticksToLive > POWER_CREEP_LIFE_TIME * 0.1) return false

    const powerSpawn = this.room.roomManager.powerSpawn
    if (!powerSpawn) return false

    const creepMemory = Memory.powerCreeps[this.name]
    creepMemory[CreepMemoryKeys.task] = {
      [CreepTaskKeys.taskName]: CreepTaskNames.advancedRenew,
      [CreepTaskKeys.target]: powerSpawn.id,
    }
    return true
  }

  [CreepTaskNames.advancedRenew]?() {
    const powerSpawn = this.room.roomManager.powerSpawn
    if (!powerSpawn) return Result.fail

    const minRange = 1
    if (getRange(this.pos, powerSpawn.pos) > minRange) {
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

    const creepMemory = Memory.powerCreeps[this.name]
    creepMemory[CreepMemoryKeys.task] = {
      [CreepTaskKeys.taskName]: CreepTaskNames.advancedEnablePower,
    }
    return true
  }

  [CreepTaskNames.advancedEnablePower]?() {
    const { controller } = this.room
    if (!controller || controller.isPowerEnabled) return Result.noAction

    const minRange = 1
    if (getRange(this.pos, controller.pos) > minRange) {
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

      return Result.action
    }

    this.enableRoom(controller)
    return Result.success
  }

  findGenerateOpsTask?() {
    if (this.powered) return false

    const power = this.powers[PWR_GENERATE_OPS]
    if (!power) return false

    if (power.cooldown) return false

    const creepMemory = Memory.powerCreeps[this.name]
    creepMemory[CreepMemoryKeys.task] = {
      [CreepTaskKeys.taskName]: CreepTaskNames.advancedGenerateOps,
    }
    return true
  }

  [CreepTaskNames.advancedGenerateOps]?() {
    this.message = 'AGO'

    if (this.powered) return false

    this.usePower(PWR_GENERATE_OPS)
    this.powered = true
    return true
  }

  findTransferOpsTask?() {
    const storedOps = this.store.getUsedCapacity(RESOURCE_OPS)
    if (storedOps <= this.store.getCapacity() * 0.8) return false

    // We are sufficiently full of ops

    const storingStructure = CommuneUtils.storingStructures(this.room)[0]
    if (!storingStructure) return false

    const creepMemory = Memory.powerCreeps[this.name]
    creepMemory[CreepMemoryKeys.task] = {
      [CreepTaskKeys.taskName]: CreepTaskNames.transferOps,
      [CreepTaskKeys.target]: storingStructure.id,
    }
    return true
  }

  [CreepTaskNames.transferOps]?() {
    // We are sufficiently full of ops

    const storingStructure = CommuneUtils.storingStructures(this.room)[0]
    if (!storingStructure) return false

    const transferAmount = this.store.getUsedCapacity(RESOURCE_OPS) * 0.5

    this.advancedTransfer(storingStructure, RESOURCE_OPS, transferAmount)
    return true
  }

  // Complex power tasks

  findPowerTask?() {
    const creepMemory = Memory.powerCreeps[this.name]
    let task = creepMemory[CreepMemoryKeys.powerTask]
    if (task) {
      return task
    }

    const request = this.findNewBestPowerTask()
    if (request === Result.fail) return Result.fail

    const target = findObjectWithID(request.targetID)
    target.reservePowers
    target._reservePowers.add(request.power)

    task = creepMemory[CreepMemoryKeys.powerTask] = {
      [CreepPowerTaskKeys.target]: request.targetID,
      [CreepPowerTaskKeys.power]: request.power,
    }
    delete this.room.powerRequests[request.taskID]

    return task
  }

  findNewBestPowerTask?() {
    let lowestScore = Infinity
    let bestTask: PowerRequest

    for (const ID in this.room.powerRequests) {
      const request = this.room.powerRequests[ID]

      // We don't have the requested power

      const power = this.powers[request.power]
      if (!power) continue

      // We don't have enough ops for the task

      if ((POWER_INFO[request.power] as any).ops > this.nextStore.ops) continue

      const taskTargetPos = findObjectWithID(request.targetID).pos
      const range = getRange(this.pos, taskTargetPos)

      // The target doesn't need us yet or we can't yet provide

      if (
        Math.max(request.cooldown, this.powerCooldowns.get(request.power) || 0) >
        range + (POWER_INFO[request.power] as any).range + 3
      )
        continue

      const score = request.priority + range / 100

      if (score >= lowestScore) continue

      lowestScore = score
      bestTask = request
    }

    if (!bestTask) return Result.fail

    return bestTask
  }

  runPowerTask?() {
    const task = this.findPowerTask()
    if (task === Result.fail) return Result.fail

    const target = findObjectWithID(task[CreepPowerTaskKeys.target])

    // We aren't in range, get closer
    LogOps.log('TRY TASK', target)
    const minRange = (POWER_INFO[task[CreepPowerTaskKeys.power]] as any).range
    if (minRange && getRange(this.pos, target.pos) > minRange) {
      this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: target.pos, range: minRange }],
      })
      return Result.action
    }

    // We can't or failed the power

    if (this.powered) return Result.fail

    const effect = target.effectsData.get(task[CreepPowerTaskKeys.power])
    if (effect && effect.ticksRemaining > 0) return Result.fail
    /* if (this.usePower(this.memory[CreepMemoryKeys.taskPower], taskTarget) !== OK) return Result.fail */

    this.usePower(task[CreepPowerTaskKeys.power], target)

    // We did the power
    LogOps.log('WE DID THE POWA', target)

    // Assume the power consumed ops if it does so

    const ops = (POWER_INFO[task[CreepPowerTaskKeys.power]] as any).ops
    if (ops) this.nextStore.ops -= ops

    // Define the cooldown so we don't assume the creep can still do this power immediately

    this.powerCooldowns
    this._powerCooldowns.set(
      task[CreepPowerTaskKeys.power],
      POWER_INFO[task[CreepPowerTaskKeys.power]].cooldown,
    )

    //

    this.powered = true
    delete Memory.powerCreeps[CreepMemoryKeys.powerTask]

    return Result.success
  }

  static operatorManager(room: Room, creepsOfRole: string[]) {
    // Loop through creep names of this role

    for (const creepName of creepsOfRole) {
      // Get the creep using its name

      const creep: Operator = Game.powerCreeps[creepName]

      if (creep.runTask()) continue
      if (creep.runPowerTask() === Result.success) creep.runPowerTask()
    }
  }
}
