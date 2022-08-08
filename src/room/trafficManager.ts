import { myColors } from 'international/constants'
import { customLog, pack, packXY } from 'international/generalFunctions'

export function trafficManager(room: Room) {
    if (!room.myCreepsAmount) return

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    for (const role in room.myCreeps) {
        for (const creepName of room.myCreeps[role]) Game.creeps[creepName].recurseMoveRequest()
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Traffic Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}
