import { Sleepable } from 'utils/Sleepable'
import {
    createPosMap,
    getAvgPrice,
    packXYAsNum,
    randomIntRange,
    randomRange,
    randomTick,
    roundTo,
} from '../utils/utils'

import {
    cacheAmountModifier,
    WorkRequestKeys,
    CPUBucketCapacity,
    mmoShardNames,
    customColors,
    roomDimensions,
    RoomMemoryKeys,
    minerals,
    PlayerMemoryKeys,
} from './constants'

/**
 * Handles inter room and non-room matters
 */
export class CollectiveManager extends Sleepable {
    /**
     * Antifa creeps by combat request name, then by role with an array of creep names
     */
    creepsByCombatRequest: { [requestName: string]: Partial<{ [key in CreepRoles]: string[] }> }

    creepsByHaulRequest: { [requestName: string]: string[] }

    unspawnedPowerCreepNames: string[]

    terminalRequests: { [ID: string]: TerminalRequest }

    tickID: number
    customCreepIDs: true[]
    customCreepIDIndex: number

    internationalDataVisuals: boolean

    terminalCommunes: string[]

    /**
     * The aggregate number of each mineral nodes we have access to
     */
    mineralNodes: Partial<{ [key in MineralConstant]: number }>

    /**
     * The name of the room that is safemoded, if there is one
     */
    safemodedCommuneName: string | undefined
    /**
     * An intra-tick collection of commands we wish to issue
     */
    myCommands: any[]
    /**
     * Terrain binaries of wall or not wall for rooms
     */
    terrainBinaries: { [roomName: string]: Uint8Array } = {}
    constructionSiteCount = 0
    creepCount: number
    powerCreepCount: number
    /**
     * A string to console log as rich text
     */
    logs = ''
    /**
     * Room names that have controllers we own
     */
    communes: Set<string>

    /**
     * Updates values to be present for this tick
     */
    update() {
        this.creepsByCombatRequest = {}
        this.creepsByHaulRequest = {}
        this.unspawnedPowerCreepNames = []
        this.terminalRequests = {}
        this.terminalCommunes = []

        this.tickID = 0
        this.customCreepIDs = []
        this.customCreepIDIndex = 0
        this.mineralNodes = {}
        for (const mineralType of minerals) {
            this.mineralNodes[mineralType] = 0
        }
        this.myCommands = []
        this.logs = ''
        this.creepCount = 0
        this.powerCreepCount = 0
        this.communes = new Set()

        // delete

        this.safemodedCommuneName = undefined
        this._workRequestsByScore = undefined
        this._defaultMinCacheAmount = undefined
        this.internationalDataVisuals = undefined

        if (this.isSleepingResponsive()) return

        // delete

        this._funnelOrder = undefined
        this._minCredits = undefined
        this._resourcesInStoringStructures = undefined
        this._maxCSitesPerRoom = undefined
    }

    newCustomCreepID() {
        // Try to use an existing unused ID index

        for (; this.customCreepIDIndex < this.customCreepIDs.length; this.customCreepIDIndex++) {
            if (this.customCreepIDs[this.customCreepIDIndex]) continue

            this.customCreepIDs[this.customCreepIDIndex] = true
            this.customCreepIDIndex += 1
            return this.customCreepIDIndex - 1
        }

        // All previous indexes are being used, add a new index

        this.customCreepIDs.push(true)
        this.customCreepIDIndex += 1
        return this.customCreepIDIndex - 1
    }

    advancedGeneratePixel() {
        if (!global.settings.pixelGeneration) return

        // Stop if the bot is not running on MMO

        if (!mmoShardNames.has(Game.shard.name)) return

        // Stop if the cpu bucket isn't full

        if (Game.cpu.bucket !== 10000) return

        // Try to generate a pixel

        Game.cpu.generatePixel()
    }

    /**
     * Provides a cached binary of wall or not wall terrain
     */
    getTerrainBinary(roomName: string) {
        if (this.terrainBinaries[roomName]) return this.terrainBinaries[roomName]

        this.terrainBinaries[roomName] = new Uint8Array(2500)

        const terrain = Game.map.getRoomTerrain(roomName)

        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                this.terrainBinaries[roomName][packXYAsNum(x, y)] =
                    terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0
            }
        }

        return this.terrainBinaries[roomName]
    }

    newTickID() {
        return (this.tickID += 1).toString()
    }

    _minCredits: number

    get minCredits() {
        if (this._minCredits !== undefined) return this._minCredits

        return (this._minCredits = collectiveManager.communes.size * 10000)
    }

    _workRequestsByScore: (string | undefined)[]

    get workRequestsByScore(): (string | undefined)[] {
        if (this._workRequestsByScore) return this._workRequestsByScore

        return (this._workRequestsByScore = Object.keys(Memory.workRequests).sort(
            (a, b) =>
                (Memory.workRequests[a][WorkRequestKeys.priority] ??
                    Memory.rooms[a][RoomMemoryKeys.score] +
                        Memory.rooms[a][RoomMemoryKeys.dynamicScore]) -
                (Memory.workRequests[b][WorkRequestKeys.priority] ??
                    Memory.rooms[b][RoomMemoryKeys.score] +
                        Memory.rooms[b][RoomMemoryKeys.dynamicScore]),
        ))
    }

    _defaultMinCacheAmount: number

    get defaultMinCacheAmount() {
        if (this._defaultMinCacheAmount !== undefined) return this._defaultMinCacheAmount

        const avgCPUUsagePercent = Memory.stats.cpu.usage / Game.cpu.limit

        return (this._defaultMinCacheAmount =
            Math.floor(Math.pow(avgCPUUsagePercent * 10, 2.2)) + 1)
    }

    _maxCommunes: number
    get maxCommunes() {
        return (this._maxCommunes = Math.round(Game.cpu.limit / 10))
    }

    _avgCommunesPerMineral: number
    get avgCommunesPerMineral() {
        let sum = 0

        for (const mineralType in this.mineralNodes) {
            sum += this.mineralNodes[mineralType as MineralConstant]
        }

        const avg = roundTo(sum / minerals.length, 2)
        return (this._avgCommunesPerMineral = avg)
    }

    _compoundPriority: Partial<{ [key in MineralCompoundConstant]: number }>
    get compoundPriority() {
        if (this._compoundPriority) return this._compoundPriority

        this._compoundPriority = {}

        return this._compoundPriority
    }

    _funnelOrder: string[]

    /**
     * Commune names sorted by funnel priority
     */
    get funnelOrder() {
        if (this._funnelOrder) return this._funnelOrder

        let funnelOrder: string[] = []

        // organize RCLs 1-7

        const communesByLevel: { [level: string]: [string, number][] } = {}
        for (let i = 6; i < 8; i++) communesByLevel[i] = []

        for (const roomName of collectiveManager.communes) {
            const room = Game.rooms[roomName]
            if (!room.terminal) continue

            const { controller } = room
            if (!communesByLevel[controller.level]) continue

            communesByLevel[controller.level].push([
                roomName,
                controller.progressTotal / controller.progress,
            ])
        }

        for (const level in communesByLevel) {
            // Sort by score

            communesByLevel[level].sort((a, b) => {
                return a[1] - b[1]
            })

            funnelOrder = funnelOrder.concat(communesByLevel[level].map(tuple => tuple[0]))
        }

        return (this._funnelOrder = funnelOrder)
    }

    _resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>
    get resourcesInStoringStructures() {
        if (this._resourcesInStoringStructures) return this._resourcesInStoringStructures

        this._resourcesInStoringStructures = {}

        for (const roomName of collectiveManager.communes) {
            const room = Game.rooms[roomName]
            const resources = room.roomManager.resourcesInStoringStructures

            for (const key in resources) {
                const resource = key as unknown as ResourceConstant

                if (!this._resourcesInStoringStructures[resource])
                    this._resourcesInStoringStructures[resource] = resources[resource]
                this._resourcesInStoringStructures[resource] = resources[resource]
            }
        }

        return this._resourcesInStoringStructures
    }

    _maxCSitesPerRoom: number
    /**
     * The largest amount of construction sites we can try to have in a room
     */
    get maxCSitesPerRoom() {
        if (this._maxCSitesPerRoom) return this._maxCSitesPerRoom

        return Math.max(Math.min(MAX_CONSTRUCTION_SITES / collectiveManager.communes.size, 20), 3)
    }
}

export const collectiveManager = new CollectiveManager()
