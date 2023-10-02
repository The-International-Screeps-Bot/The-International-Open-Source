import {
    antifaRoles,
    chant,
    WorkRequestKeys,
    CombatRequestKeys,
    creepRoles,
    haulerUpdateDefault,
    HaulRequestKeys,
    maxWorkRequestDistance,
    maxCombatDistance,
    maxHaulDistance,
    customColors,
    powerCreepClassNames,
    remoteRoles,
    stamps,
    RoomMemoryKeys,
    RoomTypes,
} from './constants'
import {
    advancedFindDistance,
    createPosMap,
    findCarryPartsRequired,
    findClosestRoomName,
    findCPUOf,
    randomRange,
    randomTick,
} from '../utils/utils'
import { collectiveManager, CollectiveManager } from './collective'
import { statsManager } from './statsManager'
import { indexOf } from 'lodash'
import { CommuneManager } from 'room/commune/commune'
import { powerCreepClasses } from 'room/creeps/powerCreepClasses'
import { RoomManager } from 'room/room'
import { roomUtils } from 'room/roomUtils'

class TickInit {
    configGeneral() {

        // Chant logic

        if (global.settings.creepChant) {
            if (Memory.chantIndex >= chant.length - 1) Memory.chantIndex = 0
            else Memory.chantIndex += 1
        }
    }
}

export const tickInit = new TickInit()
