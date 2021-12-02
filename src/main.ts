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
         * Whether Memory is constructed or not
         */
        constructed: true | undefined

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

        /**
         * The total number of creeps the bot owns
         */
        creepCount: number

        /**
         * The total amount of energy harvested by the bot per tick
         */
        energyHarvested: number
    }

    interface RawMemory {
        [key: string]: any

    }

    // Room

    interface Room {
        [key: string]: any

        /**
         * The amount of creeps with a task of harvesting sources in the room
         */
        creepsOfSourceAmount: {[key: string]: number}

        /**
         * An object with keys of roles with properties of arrays of creep names belonging to the role from this room
         */
        myCreeps: {[key: string]: string[]}

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepCount: {[key: string]: number}
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

            /**
             * Whether global is constructed or not
             */
            constructed: true | undefined

            /**
             * The username of the account running the bot
             */
            me: string

            /**
             * An array of usernames for which to treat as allies
             */
            allyList: string[]

            /**
             * An array of names for each role creeps can have
             */
            creepRoles: string[]

            /**
             * An array of usernames for which to not trade with
             */
            tradeBlacklist: string[]

            /**
             * An object with labels of colour names and properties of hex codes
             */
            colors: {[key: string]: string}

            /**
             *
             */
            roomDimensions: number

            /**
             * An array of all structureTypes in the game
             */
            allStructureTypes: StructureConstant[]

             /**
             * An array of structureTypes that can't be walked on by creeps
             */
            impassibleStructures: StructureConstant[]
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
