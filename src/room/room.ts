import {
    adjacentOffsets,
    creepRoles,
    customColors,
    defaultRoadPlanningPlainCost,
    powerCreepClassNames,
    remoteTypeWeights,
    roomDimensions,
    roomTypesUsedForStats,
} from 'international/constants'
import {
    cleanRoomMemory,
    customLog,
    findObjectWithID,
    forAdjacentCoords,
    forCoordsInRange,
    packAsNum,
    randomTick,
} from 'international/utils'
import { CommuneManager } from './commune/commune'
import { DroppedResourceManager } from './droppedResources'
import { ContainerManager } from './container'
import { CreepRoleManager } from './creeps/creepRoleManager'
import { EndTickCreepManager } from './creeps/endTickCreepManager'
import { PowerCreepRoleManager } from './creeps/powerCreepRoleManager'
import { RoomVisualsManager } from './roomVisuals'
import { statsManager } from 'international/statsManager'
import { CommunePlanner } from './communePlanner'
import { TombstoneManager } from './tombstones'
import { RuinManager } from './ruins'
import { packCoord, packPosList, unpackPos, unpackPosList, unpackStampAnchors } from 'other/codec'
import { BasePlans } from './construction/basePlans'

export class RoomManager {
    communePlanner: CommunePlanner
    containerManager: ContainerManager
    droppedResourceManager: DroppedResourceManager
    tombstoneManager: TombstoneManager
    ruinManager: RuinManager

    creepRoleManager: CreepRoleManager
    powerCreepRoleManager: PowerCreepRoleManager
    endTickCreepManager: EndTickCreepManager
    roomVisualsManager: RoomVisualsManager

    constructor() {
        this.communePlanner = new CommunePlanner(this)
        this.containerManager = new ContainerManager(this)
        this.droppedResourceManager = new DroppedResourceManager(this)
        this.tombstoneManager = new TombstoneManager(this)
        this.ruinManager = new RuinManager(this)

        this.creepRoleManager = new CreepRoleManager(this)
        this.powerCreepRoleManager = new PowerCreepRoleManager(this)
        this.endTickCreepManager = new EndTickCreepManager(this)
        this.roomVisualsManager = new RoomVisualsManager(this)
    }

    room: Room

    public update(room: Room) {
        this.room = room

        delete this._usedControllerCoords
        delete this._generalRepairStructures
        delete this._rampartRepairTargets

        if (randomTick()) {
            delete this._nukeTargetCoords
        }
    }

    preTickRun() {
        const { room } = this
        const roomMemory = room.memory

        // If it hasn't been scouted for 100~ ticks

        if (Game.time - roomMemory.LST > Math.floor(Math.random() * 200)) {
            room.basicScout()
            cleanRoomMemory(room.name)
        }

        const roomType = roomMemory.T
        if (Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType))
            statsManager.roomPreTick(room.name, roomType)

        room.moveRequests = {}
        room.creepPositions = {}
        room.powerCreepPositions = {}

        // Single tick properties

        room.myCreeps = {}
        for (const role of creepRoles) room.myCreeps[role] = []

        room.myPowerCreeps = {}
        for (const className of powerCreepClassNames) room.myPowerCreeps[className] = []

        room.myCreepsAmount = 0
        room.myPowerCreepsAmount = 0

        room.partsOfRoles = {}
        room.powerTasks = {}

        room.creepsOfSource = []
        for (const index in room.find(FIND_SOURCES)) room.creepsOfSource.push([])

        room.squadRequests = new Set()

        room.roomLogisticsRequests = {
            transfer: {},
            withdraw: {},
            offer: {},
            pickup: {},
        }

        if (roomMemory.T === 'remote') return

        // Check if the room is a commune

        if (!room.controller) return

        if (!room.controller.my) {
            if (roomMemory.T === 'commune') {
                roomMemory.T = 'neutral'

                room.basicScout()
                cleanRoomMemory(room.name)
            }
            return
        }

        room.communeManager = global.communeManagers[room.name]

        if (!room.communeManager) {
            room.communeManager = new CommuneManager()
            global.communeManagers[room.name] = room.communeManager
        }

        // new commune planner

        room.communeManager.update(room)
        room.communeManager.preTickRun()
    }

    public run() {
        if (this.room.memory.T === 'remote') {
            this.containerManager.runRemote()
            this.droppedResourceManager.runRemote()
            this.tombstoneManager.runRemote()
            this.ruinManager.runRemote()
        }

        this.creepRoleManager.run()
        this.powerCreepRoleManager.run()
        this.endTickCreepManager.run()
        this.roomVisualsManager.run()
    }

    _anchor: RoomPosition
    get anchor() {
        if (this._anchor !== undefined) return this._anchor

        const stampAnchors = this.stampAnchors
        if (!stampAnchors) return false

        return (this._anchor = new RoomPosition(
            stampAnchors.fastFiller[0].x,
            stampAnchors.fastFiller[0].y,
            this.room.name,
        ))
    }

    _mineral: Mineral
    get mineral() {
        if (this._mineral) return this._mineral

        const mineralID = Memory.rooms[this.room.name].MID
        if (mineralID) return findObjectWithID(mineralID)

        const mineral = this.room.find(FIND_MINERALS)[0]
        Memory.rooms[this.room.name].MID = mineral.id

        return (this._mineral = mineral)
    }

    _nukeTargetCoords: Uint8Array
    get nukeTargetCoords() {
        if (this._nukeTargetCoords) return this._nukeTargetCoords

        this._nukeTargetCoords = new Uint8Array(roomDimensions * roomDimensions)

        for (const nuke of this.room.find(FIND_NUKES)) {
            this._nukeTargetCoords[packAsNum(nuke.pos)] += NUKE_DAMAGE[0]

            forCoordsInRange(nuke.pos, 2, adjCoord => {
                this._nukeTargetCoords[packAsNum(adjCoord)] += NUKE_DAMAGE[2]
            })
        }

        return this._nukeTargetCoords
    }

    _stampAnchors: StampAnchors
    get stampAnchors() {
        if (this._stampAnchors !== undefined) return this._stampAnchors

        const packedStampAnchors = this.room.memory.SA
        if (!packedStampAnchors) return false

        return (this._stampAnchors = unpackStampAnchors(packedStampAnchors))
    }

    /**
     * Sources sorted by optimal commune utilization
     */
    _communeSources: Source[]
    get communeSources() {
        if (this._communeSources) return this._communeSources

        const sourceIDs = this.room.memory.CSIDs
        if (sourceIDs) {
            this._communeSources = []

            for (let i = 0; i < sourceIDs.length; i++) {
                const source = findObjectWithID(sourceIDs[i])

                source.communeIndex = i
                this._communeSources.push(source)
            }

            return this._communeSources
        }

        throw Error('No commune sources ' + this.room.name)
        return this._communeSources
    }

    /**
     * Sources sorted for optimal remotes utilization
     */
    _remoteSources: Source[]
    get remoteSources() {
        if (this._remoteSources) return this._remoteSources

        const sourceIDs = this.room.memory.RSIDs
        if (sourceIDs) {
            this._remoteSources = []

            for (let i = 0; i < sourceIDs.length; i++) {
                const source = findObjectWithID(sourceIDs[i])

                source.remoteIndex = i
                this._remoteSources.push(source)
            }

            return this._remoteSources
        }

        const commune = Game.rooms[this.room.memory.CN]
        if (!commune) throw Error('No commune for remote source harvest positions ' + this.room.name)

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest positions ' + this.room.name)

        const sources = this.room.find(FIND_SOURCES)

        sources.sort((a, b) => {
            return (
                this.room.advancedFindPath({
                    origin: a.pos,
                    goals: [{ pos: anchor, range: 3 }],
                }).length -
                this.room.advancedFindPath({
                    origin: b.pos,
                    goals: [{ pos: anchor, range: 3 }],
                }).length
            )
        })

        this.room.memory.RSIDs = sources.map(source => source.id)
        return (this._remoteSources = sources)
    }

    _sourceHarvestPositions: RoomPosition[][]
    get sourceHarvestPositions() {
        if (this._sourceHarvestPositions) return this._sourceHarvestPositions

        const sourceHarvestPositions: RoomPosition[][] = []
        const terrain = this.room.getTerrain()
        const sources = this.room.find(FIND_SOURCES)

        for (let i = 0; i < sources.length; i++) {
            const source = sources[i]
            sourceHarvestPositions.push([])

            for (const pos of this.room.findAdjacentPositions(source.pos.x, source.pos.y)) {
                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

                sourceHarvestPositions[i].push(pos)
            }
        }

        return (this._sourceHarvestPositions = sourceHarvestPositions)
    }

    _communeSourceHarvestPositions: RoomPosition[][]
    get communeSourceHarvestPositions() {
        if (this._communeSourceHarvestPositions) return this._communeSourceHarvestPositions

        const packedSourceHarvestPositions = this.room.memory.CSHP

        if (packedSourceHarvestPositions) {
            return (this._communeSourceHarvestPositions = packedSourceHarvestPositions.map(positions =>
                unpackPosList(positions),
            ))
        }

        throw Error('No commune source harvest positions ' + this.room.name)
        return this._communeSourceHarvestPositions
    }

    _remoteSourceHarvestPositions: RoomPosition[][]
    get remoteSourceHarvestPositions() {
        if (this._remoteSourceHarvestPositions) return this._remoteSourceHarvestPositions

        const packedSourceHarvestPositions = this.room.memory.RSHP
        if (packedSourceHarvestPositions) {
            return (this._remoteSourceHarvestPositions = packedSourceHarvestPositions.map(positions =>
                unpackPosList(positions),
            ))
        }

        const commune = Game.rooms[this.room.memory.CN]
        if (!commune) throw Error('No commune for remote source harvest positions ' + this.room.name)

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest positions ' + this.room.name)

        const terrain = this.room.getTerrain()
        const sourceHarvestPositions: RoomPosition[][] = []

        for (const source of this.remoteSources) {
            const positions = []

            // Loop through each pos

            for (const pos of this.room.findAdjacentPositions(source.pos.x, source.pos.y)) {
                // Iterate if terrain for pos is a wall

                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

                // Add pos to harvestPositions

                positions.push(pos)
            }

            positions.sort((a, b) => {
                return (
                    this.room.advancedFindPath({
                        origin: a,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length -
                    this.room.advancedFindPath({
                        origin: b,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length
                )
            })

            sourceHarvestPositions.push(positions)
        }

        this.room.memory.RSHP = sourceHarvestPositions.map(positions => packPosList(positions))
        return (this._remoteSourceHarvestPositions = sourceHarvestPositions)
    }

    _communeSourcePaths: RoomPosition[][]
    get communeSourcePaths() {
        if (this._communeSourcePaths) return this._communeSourcePaths

        const packedSourcePaths = this.room.memory.CSPs
        if (packedSourcePaths) {
            return (this._communeSourcePaths = packedSourcePaths.map(positions => unpackPosList(positions)))
        }

        throw Error('No commune source paths ' + this.room.name)
        return (this._communeSourcePaths = [])
    }

    _remoteSourcePaths: RoomPosition[][]
    get remoteSourcePaths() {
        if (this._remoteSourcePaths) return this._remoteSourcePaths

        const packedSourcePaths = this.room.memory.RSPs
        if (packedSourcePaths) {
            return (this._remoteSourcePaths = packedSourcePaths.map(positions => unpackPosList(positions)))
        }

        const commune = Game.rooms[this.room.memory.CN]
        if (!commune) throw Error('No commune for remote source harvest paths ' + this.room.name)

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest paths' + this.room.name)

        const sourcePaths: RoomPosition[][] = []
        const sourceHarvestPositions = this.remoteSourceHarvestPositions
        for (let index in this.room.find(FIND_SOURCES)) {
            const path = this.room.advancedFindPath({
                origin: sourceHarvestPositions[index][0],
                goals: [{ pos: anchor, range: 3 }],
                typeWeights: remoteTypeWeights,
                plainCost: defaultRoadPlanningPlainCost,
                weightStructurePlans: true,
                avoidStationaryPositions: true,
            })

            sourcePaths.push(path)
        }

        this.room.memory.RSPs = sourcePaths.map(path => packPosList(path))
        return (this._remoteSourcePaths = sourcePaths)
    }

    _centerUpgradePos: RoomPosition
    get centerUpgradePos() {
        if (this._centerUpgradePos) return this._centerUpgradePos

        const packedPos = this.room.memory.CUP
        if (packedPos) {
            return (this._centerUpgradePos = unpackPos(packedPos))
        }

        throw Error('No center upgrade pos ' + this.room.name)

        return this._centerUpgradePos
    }

    _upgradePositions: RoomPosition[]
    get upgradePositions() {
        /* if (this._upgradePositions) return this._upgradePositions */

        // Get the center upgrade pos, stopping if it's undefined

        const centerUpgradePos = this.centerUpgradePos

        const anchor = this.anchor
        if (!anchor) throw Error('No anchor for upgrade positions ' + this.room.name)

        const positions: RoomPosition[] = []
        const terrain = this.room.getTerrain()

        for (const offset of adjacentOffsets) {
            const adjPos = new RoomPosition(
                offset.x + centerUpgradePos.x,
                offset.y + centerUpgradePos.y,
                this.room.name,
            )

            if (terrain.get(adjPos.x, adjPos.y) === TERRAIN_MASK_WALL) continue

            positions.push(adjPos)
        }

        positions.sort((a, b) => {
            return (
                this.room.advancedFindPath({
                    origin: a,
                    goals: [{ pos: anchor, range: 3 }],
                }).length -
                this.room.advancedFindPath({
                    origin: b,
                    goals: [{ pos: anchor, range: 3 }],
                }).length
            )
        })

        // Make the closest pos the last to be chosen

        positions.push(positions.shift())

        // Make the center pos the first to be chosen (we want upgraders to stand on the container)

        positions.unshift(centerUpgradePos)

        return (this._upgradePositions = positions)
    }

    _mineralHarvestPositions: RoomPosition[]
    get mineralHarvestPositions() {
        if (this._mineralHarvestPositions) return this._mineralHarvestPositions

        const packedPositions = this.room.memory.MP
        if (packedPositions) {
            return (this._mineralHarvestPositions = unpackPosList(packedPositions))
        }

        throw Error('No mineral harvest positions ' + this.room.name)
        return this._mineralHarvestPositions
    }

    _generalRepairStructures: (StructureContainer | StructureRoad)[]
    get generalRepairStructures() {
        // THIS CODE WON'T WORK FOR HIGHWAY ROOMS! FIX!

        if (this._generalRepairStructures) return this._generalRepairStructures

        const generalRepairStructures: (StructureContainer | StructureRoad)[] = []

        const roomType = this.room.memory.T
        if (roomType === 'commune') {
            const structures = this.room.structures
            const relevantStructures = (structures.container as (StructureContainer | StructureRoad)[]).concat(
                structures.road,
            )
            const basePlans = BasePlans.unpack(this.room.memory.BPs)
            const RCL = this.room.controller.level

            for (const structure of relevantStructures) {
                const coordData = basePlans.map[packCoord(structure.pos)]
                if (!coordData) continue

                for (const data of coordData) {
                    if (data.minRCL > RCL) continue
                    if (data.structureType !== structure.structureType) break

                    generalRepairStructures.push(structure)
                    break
                }
            }

            return (this._generalRepairStructures = generalRepairStructures)
        }
        if (roomType === 'remote') {
            return (this._generalRepairStructures = generalRepairStructures)
        }

        // Non-commune non-remote

        return (this._generalRepairStructures = generalRepairStructures)
    }

    _remoteControllerPositions: RoomPosition[]
    get remoteControllerPositions() {
        if (this._remoteControllerPositions) return this._remoteControllerPositions

        const roomMemory = Memory.rooms[this.room.name]
        const packedRemoteControllerPositions = roomMemory.RCP
        if (packedRemoteControllerPositions) {
            return (this._remoteControllerPositions = unpackPosList(packedRemoteControllerPositions))
        }

        this._remoteControllerPositions = []
        const positions: RoomPosition[] = []

        const commune = Game.rooms[roomMemory.CN]
        if (!commune) throw Error('No commune for remote controller positions ' + this.room.name)

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('no anchor found for controller positions ' + this.room.name)

        const controllerPos = this.room.controller.pos
        const terrain = this.room.getTerrain()

        for (let offset of adjacentOffsets) {
            const adjPos = new RoomPosition(offset.x + controllerPos.x, offset.y + controllerPos.y, this.room.name)

            if (terrain.get(adjPos.x, adjPos.y) === TERRAIN_MASK_WALL) continue

            positions.push(adjPos)
        }

        positions.sort((a, b) => {
            return (
                this.room.advancedFindPath({
                    origin: a,
                    goals: [{ pos: anchor, range: 3 }],
                }).length -
                this.room.advancedFindPath({
                    origin: b,
                    goals: [{ pos: anchor, range: 3 }],
                }).length
            )
        })

        this.room.memory.RCP = packPosList(positions)
        return (this._remoteControllerPositions = positions)
    }

    _usedControllerCoords: Set<string>
    /**
     * Positions around the controller used for reserving, claiming, and downgrading
     */
    get usedControllerCoords() {
        if (this._usedControllerCoords) return this._usedControllerCoords

        this._usedControllerCoords = new Set()

        for (const creepName of this.room.myCreeps.remoteReserver) {
            // Get the creep using its name

            const creep = Game.creeps[creepName]

            // If the creep is isDying, iterate

            if (creep.isDying()) continue

            const packedCoord = creep.memory.PC
            if (!packedCoord) continue

            // The creep has a packedPos

            this._usedControllerCoords.add(packedCoord)
        }

        return this._usedControllerCoords
    }

    _remoteControllerPath: RoomPosition[]
    get remoteControllerPath() {
        if (this._remoteControllerPath) return this._remoteControllerPath

        const packedPath = this.room.memory.RCPa
        if (packedPath) {
            return (this._remoteControllerPath = unpackPosList(packedPath))
        }

        const commune = Game.rooms[this.room.memory.CN]
        if (!commune) throw Error('No commune for remote controller path ' + this.room.name)

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote controller path' + this.room.name)

        const path = this.room.advancedFindPath({
            origin: this.remoteControllerPositions[0],
            goals: [{ pos: anchor, range: 3 }],
            typeWeights: remoteTypeWeights,
            plainCost: defaultRoadPlanningPlainCost,
            weightStructurePlans: true,
            avoidStationaryPositions: true,
        })

        this.room.memory.RCPa = packPosList(path)
        return (this._remoteControllerPath = path)
    }

    _rampartRepairTargets: StructureRampart[]
    get rampartRepairTargets() {
        const rampartRepairTargets: StructureRampart[] = []

        return (this._rampartRepairTargets = rampartRepairTargets)
    }
}
