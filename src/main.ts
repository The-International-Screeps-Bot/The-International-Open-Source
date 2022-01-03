// Imports

// Global

import './global/globalFunctions'

// International

import { internationalManager } from './international/internationalManager'

// Room

import { roomManager } from './room/roomManager'

import {
    SourceHarvester,
    Hauler,
    ControllerUpgrader,
    MineralHarvester,
    Antifa
} from './room/creeps/creepClasses'

// Other

import { logManager } from 'other/logManager'
import { memHack } from 'other/memHack'
import { RoomTask } from 'room/tasks'

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

    type CreepRoles = 'sourceHarvester' |
    'hauler' |
    'controllerUpgrader'

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
    'source1Container' |
    'source2Container' |
    'controllerContainer' |
    'source1Link' |
    'source2Link' |
    'source1Container' |
    'source2Container' |
    'structuresForSpawning' |
    'notMyCreeps' |
    'enemyCreeps' |
    'allyCreeps' |
    'myDamagedCreeps' |
    'damagedAllyCreeps' |
    'terrainCM'

    interface PathGoal {
        pos: RoomPosition
        range: number
    }

    interface PathOpts {
        origin: RoomPosition
        goal: PathGoal
        avoidTypes?: string[]
        plainCost?: number
        swampCost?: number
        maxRooms?: number
        flee?: boolean
        creep?: Creep
        useRoads?: boolean
        avoidEnemyRanges?: boolean
        avoidImpassibleStructures?: boolean
        prioritizeRamparts?: boolean
    }

    interface MoveRequestOpts extends PathOpts {
        cacheAmount?: number
    }

    interface creepClasses {
        [key: string]: SourceHarvester |
        Hauler |
        ControllerUpgrader |
        MineralHarvester |
        Antifa
    }

    interface Commune extends Room {

    }

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
         * The cumulative amount of creeps with a roomFrom value of this room's name
         */
        creepsFromRoomAmount: number

        /**
         * An array of towers that have not yet used intents
         */
        actionableTowers: StructureTower[]

        /**
         * Tasks that currently have a creep trying to fulfill them
         */
        tasksWithResponders: {[key: string]: RoomTask}

        /**
         * Tasks that don't currently have a responder
         */
        tasksWithoutResponders: {[key: string]: RoomTask}

        /**
         * An object, if constructed, containing keys of resource types and values of the number of those resources in the room's terminal and storage
         */
        storedResources: {[key: string]: number}

        creepPositions: Map<RoomPosition, string>

        moveRequests: Map<RoomPosition, string[]>

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
         * Converts a custom Pos into a Game's RoomPosition
         */
        newPos(pos: Pos): RoomPosition

        /**
         *
         * @param pos1 The position of the thing performing the action
         * @param pos2 The position of the thing getting intereacted with
         * @param type The type of interaction, success if not provided
         */
        actionVisual(pos1: RoomPosition, pos2: RoomPosition, type?: string): void

        /**
         *
         * @param originRoomName
         * @param goalRoomName
         * @param avoidTypes
         */
        advancedFindPath(opts: PathOpts): RoomPosition[]

        /**
         * Finds the distance between two rooms based on walkable exits while avoiding rooms with specified types
         */
        advancedFindDistance(originRoomName: string, goalRoomName: string, avoidTypes?: string[]): number

        /**
         * Finds the amount of a specified resourceType in the room's storage and teminal
         */
        findStoredResourceAmount(resourceType: ResourceConstant): number

        /**
         * Tries to delete a task with the provided ID and response state
         */
        deleteTask(taskID: number, responder: boolean): void

        /**
         * Finds the type of a room and initializes its custom properties
         * @param scoutingRoom The room that is performing the scout operation
         */
        findType(scoutingRoom: Room): void

        /**
         * Finds the score of rooms for potential communes
         */
        findScore(): void

        /**
         * Finds and heals damaged my or allied creeps
         */
        healCreeps(towers: StructureTower): void

        /**
         * Finds open spaces in a room
         */
        distanceTransform(): any

        advancedSell(resourceType: ResourceConstant, amount: number): boolean

        advancedBuy(resourceType: ResourceConstant, amount: number): boolean
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

        /**
         * Attempt to upgrade the controller optimally
         */
        advancedUpgradeController(): boolean

        /**
         *
         */
        needsNewPath(goalPos: RoomPosition, cacheAmount: number): boolean

        /**
         *
         */
        createMoveRequest(opts: MoveRequestOpts): boolean

        /**
         * Try to enforce a moveRequest and inform the result
         */
        runMoveRequest(pos: RoomPosition): ScreepsReturnCode
    }

    interface CreepMemory {
        [key: string]: any

        /**
         * Generally describes the body parts and tasks the creep is expected to do
         */
        role: string

        /**
         * The last time a path was cached in memory
         */
        lastCache: number

        sourceName: 'source1' | 'source2'
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
             * A strings to custom log as rich text
             */
            logs: string

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

export const loop = function() {

    memHack.modifyMemory()

    internationalManager()

    roomManager()

    logManager()
}
