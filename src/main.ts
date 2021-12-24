// Imports

// Global

import './global/globalFunctions'

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

    interface Pos {
        x: number
        y: number
    }

    interface Rect {
        x1: number
        y1: number
        x2: number
        y2: number
    }

    interface Colors {
        white: string
        lightGrey: string
        lightBlue: string
        darkBlue: string
        black: string
        yellow: string
        red: string
        green: string
    }

    type RoomObjectName =
    'anchorPoint' |
    'mineral' |
    'source1' |
    'source2' |
    'sources' |
    StructureConstant |
    'source1HarvestPositions' |
    'source1ClosestHarvestPosition' |
    'source2HarvestPositions' |
    'source2ClosestHarvestPosition' |
    'source1Link' |
    'source2Link' |
    'source1Container' |
    'source2Container' |
    'structuresForSpawning' |
    'notMyCreeps' |
    'enemyCreeps' |
    'allyCreeps' |
    'myDamagedCreeps' |
    'damagedAllyCreeps'

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
         * An ongoing record of the latest ID assigned by the bot
         */
        ID: number

        /**
         * An object of constrctionsSites with keys of site IDs and properties of the site's age
         */
        constructionSites: {[key: string]: number}

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
         * The total number of powerCreeps the bot owns
         */
        powerCreepCount: number

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
         * An object with keys of roles with properties of arrays of creep names belonging to the role
         */
        myCreeps: {[key: string]: string[]}

        /**
         * An object with keys of roles and properties of the number of creeps with the role
         */
        creepCount: {[key: string]: number}

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsFromRoom: {[key: string]: string[]}

        /**
         *
         */
        storedResources: {[key: string]: number }

        /**
         * An array of towers that have not yet used intents
         */
        actionableTowers: StructureTower[]

        // Functions

        /**
         * Uses caching and only operating on request to construct and get a specific roomObject based on its name
         * @param roomObjectName The name of the requested roomObject
         * @returns Either the roomObject's value, or, if the request failed, undefined
         */
        get(roomObjectName: RoomObjectName): any | undefined

        /**
         * Removes roomType-based values in the room's memory that don't match its type
         */
        cleanRoomMemory(): void

        /**
         * Finds the number of rooms between two rooms while avoiding rooms with specified types
         */
        advancedFindDistance(originRoomName: string, goalRoomName: string, avoidTypes?: string[]): number

        /**
         * Finds the amount of a specified resourceType in the room's storage and teminal
         */
        findStoredResourceAmount(resourceType: ResourceConstant): number

        /**
         * Tries to delete a task with the provided ID
         */
        deleteTask(taskID: number): void

        /**
         * Finds the score of rooms for potential communes
         */
        findScore(): void

        /**
         * Finds and heals damaged my or allied creeps
         */
        healCreeps(towers: StructureTower): void
    }

    interface RoomMemory {
        [key: string]: any

        /**
         * A description of the room's defining properties that can be used to assume other properties
         */
        type: string
    }

    // Creeps

    interface Creep {
        [key: string]: any

        // Functions

        /**
         * Tries to find a task for the creep with a type that matches the allowedTaskTypes
         */
        findTask(allowedTaskTypes: {[key: string]: boolean}): boolean
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
            [key: string | number]: any

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
            colors: Colors

            /**
             * The dimensions of a room
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

            /**
             * An object with keys of roomTypes and properties of an object of properties rooms of the type should have
             */
            roomTypes: {[key: string]: any}

            /**
             * The number of construction sites placed by the bot
             */
            constructionSitesCount: number

            // Functions

            /**
             * Finds the average trading price of a resourceType over a set amount of days
             */
            findAvgPrice(resourceType: ResourceConstant, days: number): number

            /**
             * Uses a provided ID to find an object associated with it
             */
            findObjectWithId(ID: string): any

            /**
             * Takes a rectange and returns the positions inside of it in an array
             */
            findPositionsInsideRect(rect: Rect): Pos[]

            /**
             * Checks if two positions are equal
             */
            arePositionsEqual(pos1: Pos, pos2: Pos): boolean

            /**
             * Outputs HTML and CSS styled console logs
             * @param title Title of the log
             * @param message Main content of the log
             * @param color Colour of the text. Default is black
             * @param bgColor Colour of the background. Default is white
             */
            customLog(title: string, message: any, color?: string, bgColor?: string): void

            /**
             * Generates a pixel at the cost of depleting the bucket if the bucket is full
             */
            advancedGeneratePixel(): false | 0 | -6

            /**
             * Incrememnts Memory.ID and informs the result
             * @returns a new ID
             */
            newID(): number

            // Command functions

            /**
             * Kills all owned creeps
             */
            killAllCreeps(): string
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
