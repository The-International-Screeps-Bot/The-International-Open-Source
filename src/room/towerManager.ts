import { myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './towerFunctions'

/**
 * Dictates and operates tasks for towers
 */
export function towerManager(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     if (!room.structures.tower.length) return

     room.towersAttackCreeps()

     room.towersHealCreeps()

     room.towersRepairRamparts()

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Tower Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               myColors.lightGrey,
          )
}
