import { myColors } from 'international/constants'
import { customLog, pack, packXY } from 'international/generalFunctions'

Room.prototype.trafficManager = function () {
    if (!this.myCreepsAmount) return

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    for (const role in this.myCreeps)
        for (const creepName of this.myCreeps[role]) Game.creeps[creepName].recurseMoveRequest()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Traffic Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}
