import { constants, myColors } from 'international/constants'
import { customLog, pack, packXY } from 'international/generalFunctions'

export function trafficManager(room: Room) {
     if (!room.myCreepsAmount) return

     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     for (const creep of room.find(FIND_MY_CREEPS)) creep.recurseMoveRequest()

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog('Traffic Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}
