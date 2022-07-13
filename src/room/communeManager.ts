import { customLog, findClosestObject, getRange } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import { spawnManager } from './spawning/spawnManager'

import { towerManager } from './towerManager'
import { constructionManager } from './construction/constructionManager'
import { defenceManager } from './defenceManager'
import { linkManager } from './linkManager'
import './claimRequestManager'
import { myColors } from 'international/constants'

/**
 * Handles managers for exclusively commune-related actions
 */
export function communeManager(room: Room) {
    constructionManager(room)

    towerManager(room)

    marketManager(room)

    linkManager(room)

    defenceManager(room)

    room.claimRequestManager()

    spawnManager(room)

    const creeps = room.find(FIND_MY_CREEPS)
    const spawn = room.structures.spawn[0]

    let cpu = Game.cpu.getUsed()

    spawn.pos.findClosestByRange(creeps)

    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
    cpu = Game.cpu.getUsed()

    findClosestObject(spawn.pos, creeps)

    customLog('CPU USED FOR TEST 2', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
}
