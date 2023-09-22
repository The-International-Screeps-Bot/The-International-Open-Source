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
    cleanRoomMemory,
    createPosMap,
    findCarryPartsRequired,
    findClosestRoomName,
    findCPUOf,
    randomRange,
    randomTick,
} from '../utils/utils'
import { collectiveManager, CollectiveManager } from './collective'
import { updateStat, statsManager } from './statsManager'
import { indexOf } from 'lodash'
import { CommuneManager } from 'room/commune/commune'
import { powerCreepClasses } from 'room/creeps/powerCreepClasses'
import { RoomManager } from 'room/room'
import { roomUtils } from 'room/roomUtils'

class TickInit {
    configGeneral() {
        // General

        global.communes = new Set()

        // Chant logic

        if (global.settings.creepChant) {
            if (Memory.chantIndex >= chant.length - 1) Memory.chantIndex = 0
            else Memory.chantIndex += 1
        }

        // global

        global.constructionSitesCount = Object.keys(Game.constructionSites).length
        global.logs = ''
    }
}

export const tickInit = new TickInit()
