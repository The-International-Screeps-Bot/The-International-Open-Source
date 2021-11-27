// Imports

// Global

import './global/globalFunctions'
import './global/globalVars'

// International

import { internationalManager } from './international/internationalManager'

// Room

import { roomManager } from './room/roomManager'

// External

import { ErrorMapper } from './external/ErrorMapper'

// Other

import { logManager } from 'other/logManager'
import { memHack } from 'other/memHack'

// Type declareations for global

declare global {

    // Memory

    interface Memory {
        [key: string]: any

    }

    interface RawMemory {
        [key: string]: any

    }

    // Room

    interface Room {
        [key: string]: any
    }

    interface RoomMemory {
        [key: string]: any
        anchorPoint: {[key: string]: any}
    }

    // Creeps

    interface Creep {
        [key: string]: any

    }

    interface CreepMemory {
        [key: string]: any
        role: string
    }

    // PowerCreeps

    interface PowerCreep {
        [key: string]: any

    }

    interface PowerCreepMemory {
        [key: string]: any
        role: string
    }

    // Structures

    interface StructureSpawn {
        [key: string]: any
    }

    // Global

    namespace NodeJS {
        interface Global {
            [key: string]: any

            me: string
            allyList: string[]
            creepRoles: string[]
        }
    }
}

// Loop

export const loop = ErrorMapper.wrapLoop(function() {

    memHack.modifyMemory()

    internationalManager()

    roomManager()

    logManager()
})
