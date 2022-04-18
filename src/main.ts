// Imports

// International

import 'international/commands'
import { internationalManager } from 'international/internationalManager'

// Room

import { roomManager } from 'room/roomManager'

import {
    SourceHarvester,
    Hauler,
    ControllerUpgrader,
    MineralHarvester,
    Antifa
} from 'room/creeps/creepClasses'

// Other

import { endTickManager } from 'international/endTickManager'
import { memHack } from 'other/memHack'
import { RoomOfferTask, RoomPickupTask, RoomPullTask, RoomTask, RoomTransferTask, RoomWithdrawTask } from 'room/roomTasks'
import { RoomObject } from 'room/roomObject'
import { allyManager } from 'room/market/simpleAllies'

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
        brown: string
    }

    type StampTypes = 'fastFiller' |
    'hub' |
    'extensions' |
    'labs' |
    'tower' |
    'extension' |
    'observer'

    type PackedPosMap = any[]

    interface Stamp {
        offset: number
        /**
         * The range of protection from the anchor to provide when deciding rampart placement
         */
        protectionOffset: number
        size: number
        structures: {[key: string]: Pos[]}
    }

    type Stamps = Record<StampTypes, Stamp>

    type StampAnchors = Partial<Record<StampTypes, RoomPosition[]>>

    type CreepRoles = 'sourceHarvester' |
    'hauler' |
    'controllerUpgrader' |
    'builder' |
    'maintainer' |
    'mineralHarvester' |
    'hubHauler' |
    'fastFiller' |
    'meleeDefender' |
    'source1RemoteHarvester' |
    'source2RemoteHarvester' |
    'remoteHauler' |
    'remoteReserver' |
    'scout' |
    'claimer' |
    'antifa'

    type RoomObjectName =
    'terrainCM' |
    'baseCM' |
    'roadCM' |
    'structurePlans' |
    'rampartPlans' |
    'anchor' |
    'mineral' |
    'source1' |
    'source2' |
    'sources' |
    'structuresByType' |
    'cSitesByType' |
    StructureConstant |
    `${StructureConstant}CSite` |
    'enemyCSites' |
    'allyCSites' |
    'mineralHarvestPositions' |
    'closestMineralHarvestPos' |
    'source1HarvestPositions' |
    'source1ClosestHarvestPos' |
    'source2HarvestPositions' |
    'source2ClosestHarvestPos' |
    'centerUpgradePos' |
    'upgradePositions' |
    'fastFillerPositions' |
    'source1Container' |
    'source2Container' |
    'controllerContainer' |
    'mineralContainer' |
    'fastFillerContainerLeft' |
    'fastFillerContainerRight' |
    'labContainer' |
    'source1Link' |
    'source2Link' |
    'fastFillerLink' |
    'hubLink' |
    'controllerLink' |
    'source1Container' |
    'source2Container' |
    'usedMineralHarvestPositions' |
    'usedSourceHarvestPositions' |
    'usedUpgradePositions' |
    'usedFastFillerPositions' |
    'source1PathLength' |
    'source2PathLength' |
    'upgradePathLength' |
    'structuresForSpawning' |
    'notMyCreeps' |
    'enemyCreeps' |
    'allyCreeps' |
    'myDamagedCreeps' |
    'damagedAllyCreeps' |
    'remoteNamesByEfficacy'

    interface PathGoal {
        pos: RoomPosition
        range: number
    }

    interface PathOpts {
        origin: RoomPosition
        goal: PathGoal
        typeWeights?: {[key: string]: number}
        plainCost?: number
        swampCost?: number
        maxRooms?: number
        flee?: boolean
        creep?: Creep

        weightStructures?: {[key: string]: number}

        /**
         * An object with keys of weights and values of structures / creeps / cSites to weight
         */
        weightGamebjects?: {[key: string]: (Structure | Creep | ConstructionSite)[]}

        /**
         * An object with keys of weights and values of positions
         */

        weightPositions?: {[key: string]: Pos[]}
        /**
         *
         */

        weightCostMatrixes?: CostMatrix[]
        /**
         *
         */
        avoidEnemyRanges?: boolean

        avoidStationaryPositions?: boolean

        /**
         * Deprecate
         */
        avoidImpassibleStructures?: boolean

        /**
         * Weight my ramparts by this value
         */
        myRampartWeight?: number
    }

    interface FindClosestPosOfValueOpts {
        CM: CostMatrix,
        startPos: Pos
        requiredValue: number
        initialWeight?: number
        adjacentToRoads?: boolean
        roadCM?: CostMatrix
    }

    interface MoveRequestOpts extends PathOpts {
        cacheAmount?: number
    }

    interface Commune extends Room {

    }

    type OrderedStructurePlans = BuildObj[]

    interface BuildObj {
        structureType: BuildableStructureConstant
        x: number
        y: number
    }

    type RoomTaskTypes = 'pull' |
    'withdraw' |
    'transfer' |
    'pickup' |
    'offer'

    interface SpawnRequestOpts {
        defaultParts: BodyPartConstant[]
        extraParts: BodyPartConstant[]
        partsMultiplier: number
        minCost: number
        priority: number
        memoryAdditions: Partial<CreepMemory>
        groupComparator?: string[]
        threshold?: number
        minCreeps?: number | undefined
        maxCreeps?: number | undefined
        maxCostPerCreep?: number | undefined
    }

    interface ExtraOpts {
        memory: CreepMemory
        energyStructures: (StructureSpawn | StructureExtension)[]
        dryRun: boolean
    }

    interface SpawnRequest {
        body: BodyPartConstant[]
        tier: number
        cost: number
        extraOpts: ExtraOpts
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

        controlPoint: number

        energySpentOnBuilding: number

        energySpentOnRepairing: number

        energySpentOnBarricades: number

        claimTarget: string
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
         * The number of my creeps in the room
         */
        myCreepsAmount: number

        roomObjects: Partial<Record<RoomObjectName, RoomObject>>

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsFromRoom: {[key: string]: string[]}

        /**
         * The cumulative amount of creeps with a communeName value of this room's name
         */
        creepsFromRoomAmount: number

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsFromRoomWithRemote: {[key: string]: {[key: string]: string[]}}

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

        /**
         * A matrix with keys of positions and values of creep names
         */
        creepPositions: PackedPosMap

        moveRequests: PackedPosMap

        constructionSites: {[key: string]: ConstructionSite}

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
        cleanMemory(): void

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
         * Generates a path between two positions
         */
        advancedFindPath(opts: PathOpts): RoomPosition[]

        /**
         * Finds the amount of a specified resourceType in the room's storage and teminal
         */
        findStoredResourceAmount(resourceType: ResourceConstant): number

        /**
         * Tries to delete a task with the provided ID and response state
         */
        deleteTask(taskID: any, responder: boolean): void

        /**
         * Finds the type of a room and initializes its custom properties
         * @param scoutingRoom The room that is performing the scout operation
         */
        findType(scoutingRoom: Room): void

        /**
         * Finds the score of rooms for potential communes
         */
        findScore(): void

        towersRequestResources(): void

        /**
         * Finds and has towers heal damaged my or allied creeps
         */
        towersHealCreeps(): void

        towersAttackCreeps(): void

        towersRepairRamparts(): void

        /**
         * Finds open spaces in a room and records them in a cost matrix
         */
        distanceTransform(enableVisuals?: boolean, x1?: number, y1?: number, x2?: number, y2?: number): CostMatrix

        /**
         * Finds open spaces in a room without adding depth to diagonals, and records the depth results in a cost matrix
         */
        specialDT(initialCM?: CostMatrix, enableVisuals?: boolean): CostMatrix

        /**
         * Gets ranges from for each position from a certain point
         */
        floodFill(seeds: Pos[]): CostMatrix

        /**
         * Flood fills a room until it finds the closest pos with a value greater than or equal to the one specified
         */
        findClosestPosOfValue(opts: FindClosestPosOfValueOpts): RoomPosition | false

        /**
         * Checks if the creator has a task of with specified types
         */
        findTasksOfTypes(createdTaskIDs: {[key: string]: boolean}, types: Set<string>): RoomTask[]

        /**
         *
         */
        pathVisual(path: RoomPosition[], color: keyof Colors): void

        /**
         * Finds amd records a construction site for builders to target
         */
        findCSiteTargetID(creep: Creep): boolean

        /**
         * Finds and records certain information about the room's sourceHarvesters
         */
        findSourceHarvesterInfo(): void

        /**
         * Finds targets to repair given work part counts and target IDs to avoid
         */
        findRepairTargets(workPartCount: number, excludedIDs?: Set<Id<Structure>>): (StructureRoad | StructureContainer)[]

        /**
         * Groups positions with contigiousness, structured similarily to a flood fill
         */
        groupRampartPositions(rampartPositions: Pos[]): RoomPosition[][]

        /**
         *
         */
        findRoomPositionsInsideRect(x1: number, y1: number, x2: number, y2: number): RoomPosition[]

        /**
         *
         */
        advancedConstructStructurePlans(): void

        /**
         *
         */
         createPullTask(creator: Structure | Creep | Resource): void

        /**
         *
         */
         createPickupTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createOfferTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createTransferTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createWithdrawTasks(creator: Structure | Creep | Resource): void

        /**
         * Crudely estimates a room's income by accounting for the number of work parts owned by sourceHarvesters
         */
        estimateIncome(): number

        getPartsOfRoleAmount(role: CreepRoles, type?: BodyPartConstant): number

        findSourcesByEfficacy(): ('source1' | 'source2')[]

        // Market functions

        advancedSell(resourceType: ResourceConstant, amount: number): boolean

        advancedBuy(resourceType: ResourceConstant, amount: number): boolean

        // Link functions

        hubToController(hubLink: StructureLink | undefined, controllerLink: StructureLink | undefined): void

        hubToFastFiller(hubLink: StructureLink | undefined, fastFillerLink: StructureLink | undefined): void
    }

    interface RoomMemory {
        [key: string]: any

        anchor: Pos

        /**
         * A description of the room's defining properties that can be used to assume other properties
         */
        type: string

        /**
         * A set of names of remotes controlled by this room
         */
        remotes: string[]

        /**
         * If the room can be constructed by the base planner
         */
        notClaimable: boolean

        source1: Id<Source>
        source2: Id<Source>

        commune: string

        /**
         * A list of the efficacies of each source in the room
         */
        sourceEfficacies: number[]

        /**
         * A list of needs the remote wants met
         */
        needs: number[]

        /**
         * The room owner
         */
        owner: string

        /**
         * The controller's level
         */
        level: number

        powerEnabled: boolean

        /**
         * The number of towers in the room
         */
        towers: number

        /**
         * If a terminal is present in the room
         */
        hasTerminal: boolean

        /**
         * The amount of stored energy in the room
         */
        storedEnergy: number

        /**
         * A set of roomNames that portals in this room go to
         */
        portalsTo: string[]

        /**
         * The last tick the room was scouted at
         */
        lastScout: number
    }

    // Creeps

    interface Creep {
        [key: string]: any

        /**
         * The packed position of the moveRequest, if one has been made
         */
        moveRequest: number

        /**
         *
         */
        hasMoved: boolean

        hasMovedResources: boolean

        hasWorked: boolean

        hasAttacked: boolean

        hasRangedAttacked: boolean

        hasHealed: boolean

        /**
         * Whether the creep is actively pulling another creep or not
         */
        pulling: boolean

        /**
         * Whether the creep is actively getting pulled by another creep or not
         */
        gettingPulled: boolean

        /**
         * The creep's opts when trying to make a moveRequest intra tick
         */
        pathOpts: PathOpts

        // Functions

        /**
         * Wether the creep's respawn time is equal to its remaining ticks to live
         */
        isDying(): boolean

        /**
         * Sets a task to be responded by a creep
         */
        acceptTask(task: RoomTask): void

        /**
         * Tries to find a task for the creep with a type that matches the allowedTaskTypes
         */
        findTask(allowedTaskTypes: Set<RoomTaskTypes>, resourceType?: ResourceConstant): boolean

        advancedPickup(target: Resource): boolean

        advancedTransfer(target: any, resourceType?: ResourceConstant, amount?: number): boolean

        advancedWithdraw(target: any, resourceType?: ResourceConstant, amount?: number): boolean

        /**
         * Harvests a source and informs the result, while recording the result if successful
         */
        advancedHarvestSource(source: Source): boolean

        /**
         * Attempts multiple methods to upgrade the controller
         */
        advancedUpgraderController(): boolean

        /**
         * Attempts multiple methods to build a construction site
         */
        advancedBuildCSite(cSite: ConstructionSite | undefined): boolean

        /**
         *
         */
        findRampartRepairTarget(workPartCount: number, excluded?: Set<Id<StructureRampart>>): Structure | false

        /**
         *
         */
        findRepairTarget(excluded?: Set<Id<StructureRoad | StructureContainer>>): Structure | false

        /**
         *
         */
        advancedMaintain(): boolean

        findOptimalSourceName(): boolean

        findSourceHarvestPos(sourceName: ('source1' | 'source2')): boolean

        findMineralHarvestPos(): boolean

        findFastFillerPos(): boolean

        /**
         * Checks if the creep has some parts of specified types
         */
        hasPartsOfTypes(partTypes: BodyPartConstant[]): boolean

        /**
         * Gets the number of parts of a specified type a creep has
         */
        partsOfType(type: BodyPartConstant): number

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
        runMoveRequest(packedPos: number): boolean

        /**
         *
         */
        recurseMoveRequest(pos: number, queue?: string[]): void

        /**
         *
         */
        getPushed(): void

        /**
         * Decides if the creep needs to get more resources or not
         */
        needsResources(): boolean

        /**
         * Runs the appropriate task for the creep's task
         */
        fulfillTask(): boolean

        /**
         * Has the creep attempt to fulfill its pull task
         */
        fulfillPullTask(task: RoomPullTask): boolean

        /**
         * Has the creep attempt to fulfill its transfer task
         */
        fulfillTransferTask(task: RoomTransferTask): boolean

        /**
         * Has the creep attempt to fulfill its offer task
         */
        fulfillOfferTask(task: RoomOfferTask): boolean

        /**
         * Has the creep attempt to fulfill its withdraw task
         */
        fulfillWithdrawTask(task: RoomWithdrawTask): boolean

        /**
         * Have the creep attempt to fulfill its pickup task
         */
        fulfillPickupTask(task: RoomPickupTask): boolean

        /**
         * Tries to sign a room's controller depending on the situation
         */
        advancedSignController(): boolean

        isOnExit(): boolean

        findHealPower(): number

        advancedRecycle(): void

        advancedRenew(): boolean

        advancedReserveController(): boolean
    }

    interface CreepMemory {
        [key: string]: any

        /**
         * Generally describes the body parts and tasks the creep is expected to do
         */
        role: CreepRoles

        /**
         * The energy the creep cost to spawn
         */
        cost: number

        /**
         * The name of the room the creep is from
         */
        communeName: string

        /**
         * A name of the creep's designated source
         */
        sourceName: 'source1' | 'source2'

        /**
         * The creep's packed pos to sit on when harvesting
         */
        packedHarvestPos: number

        /**
         * The creep's packed upgrade pos
         */
        packedUpgradePos: number

        /**
         * The creep's packed fastFiller pos
         */
        packedFastFillerPos: number

        /**
         * The last time a path was cached in memory
         */
        lastCache: number

        /**
         * An array of positions desciring where the creep neeeds to move to get to its goal
         */
        path: RoomPosition[]

        goalPos: RoomPosition

        /**
         * Whether the creep is intended to move on its own or not
         */
        getPulled: boolean

        repairTarget: Id<Structure>

        /**
         * The name of the room the scout is trying to scout
         */
        scoutTarget: string

        /**
         * The name of the room the creep is remoting for
         */
        remoteName: string

        /**
         * The name of the room the creep is trying to claim
         */
        claimTarget: string

        /**
         * The type of task the creep has been assigned
         */
        task: RoomTaskTypes

        /**
         * The target ID of the task
         */
        taskTarget: Id<any>
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

    interface Structure {
        realHits: number
    }

    interface StructureLink {

        /**
         * Wether the link has moved any resources this tick
         */
        hasMovedResources: boolean
    }

    interface StructureSpawn {

        /**
         * Wether the spawn has renewed a creep this tick
         */
        hasRenewed: boolean

        // Functions

        advancedSpawn(spawnRequest: SpawnRequest): ScreepsReturnCode
    }

    interface StructureTower {
        inactionable: boolean
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

            tasksWithoutResponders: {[key: string]: RoomTask}

            tasksWithResponders: {[key: string]: RoomTask}

            // Command functions

            /**
             * Kills all owned creeps
             */
            killAllCreeps(): string

            /**
             * Destroys all owned construction sites
             */
            destroyAllCSites(types: StructureConstant[]): string
        }
    }
}

// Loop

export const loop = function() {

    memHack.modifyMemory()

    internationalManager()

    roomManager()

    endTickManager()
}
