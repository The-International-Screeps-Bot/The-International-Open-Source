import { findObjectWithID } from 'international/generalFunctions'
import { Hauler } from 'room/creeps/creepClasses'

Hauler.prototype.preTickManager = function () {
    if (!this.memory.taskTargetID) return

    const taskTarget = findObjectWithID(this.memory.taskTargetID) || undefined

    if (!taskTarget) {
        delete this.memory.taskTargetID
        return
    }

    taskTarget.store[this.memory.taskResource] -= this.memory.taskAmount
}
