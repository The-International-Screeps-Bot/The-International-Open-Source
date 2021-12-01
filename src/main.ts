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

        /**
         * Determines if roomVisuals will be generated
         */
        roomVisuals: boolean
        /**
         * Determines if mapVisuals will be generated
         */
        mapVisuals: boolean
        /**
         * Determines if cpu usage for modules will be logged
         */
        cpuLogging: boolean

        /**
         * An array of roomNames that have controllers we own
         */
        communes: string[]

        /**
         * The amount of energy in storages and terminals in owned rooms
         */
        energy: number

        /**
         * An object of boosts representing the amount of each boost in storages and terminals in owned rooms
         */
        boosts: {[key: string]: MineralBoostConstant}

        /**
         * The total amount of CPU used
         */
        cpuUsage: number

        /**
         * The amount of CPU generated per tick
         */
        cpuLimit: number

        /**
         * The amount of CPU left in the bucket
         */
        cpuBucket: number

        /**
         * The amount of memory used by the bot
         */
         memorUsage: number

        /**
         * The maximum memory the bot can use
         */
        memoryLimit: number
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
