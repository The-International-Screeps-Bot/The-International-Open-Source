import {
    CreepMemoryKeys,
    RoomMemoryKeys,
    RoomTypes,
    adjacentOffsets,
    allStructureTypes,
    creepRoles,
    customColors,
    defaultRoadPlanningPlainCost,
    defaultStructureTypesByBuildPriority,
    dynamicScoreRoomRange,
    maxControllerLevel,
    powerCreepClassNames,
    preferredCommuneRange,
    remoteTypeWeights,
    roomDimensions,
    roomTypesUsedForStats,
} from 'international/constants'
import {
    advancedFindDistance,
    cleanRoomMemory,
    customLog,
    findClosestObject,
    findObjectWithID,
    forAdjacentCoords,
    forCoordsInRange,
    forRoomNamesAroundRangeXY,
    getRangeXY,
    makeRoomCoord,
    packAsNum,
    randomTick,
    roomNameFromRoomCoord,
    roomNameFromRoomXY,
    sortBy,
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
import { packCoord, packPosList, unpackCoord, unpackPos, unpackPosAt, unpackPosList, unpackStampAnchors } from 'other/codec'
import { BasePlans } from './construction/basePlans'
import { RampartPlans } from './construction/rampartPlans'
import { customFindPath } from 'international/customPathFinder'

export class RoomManager {
    // sub managers

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

    update(room: Room) {
        delete this.checkedStructureUpdate
        delete this.checkedCSiteUpdate
        delete this._usedControllerCoords
        delete this._generalRepairStructures
        delete this._communeSources
        delete this._remoteSources
        delete this._mineral
        delete this._usedStationaryCoords
        delete this.checkedStructureUpdate
        delete this.checkedCSiteUpdate
        delete this._structures
        delete this._cSites

        if (randomTick()) {
            delete this._nukeTargetCoords
        }

        this.room = room
        const roomMemory = room.memory

        // If it hasn't been scouted for 100~ ticks

        if (Game.time - roomMemory[RoomMemoryKeys.lastScout] > Math.floor(Math.random() * 200)) {
            room.basicScout()
            cleanRoomMemory(room.name)
        }

        const roomType = roomMemory[RoomMemoryKeys.type]
        if (Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType)) {
            statsManager.roomPreTick(room.name, roomType)
        }

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

        if (roomMemory[RoomMemoryKeys.type] === RoomTypes.remote) return

        // Check if the room is a commune

        if (!room.controller) return

        if (!room.controller.my) {
            if (roomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
                roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral

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
    }

    preTickRun() {
        if (this.room.communeManager) {
            this.room.communeManager.preTickRun()
        }
    }

    run() {
        if (this.room.memory[RoomMemoryKeys.type] === RoomTypes.remote) {
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

    findRemoteSources(commune: Room) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest positions ' + this.room.name)

        const sources = this.room.find(FIND_SOURCES)

        sortBy(
            sources,
            ({ pos }) =>
                customFindPath({
                    origin: pos,
                    goals: [{ pos: anchor, range: 3 }],
                }).length,
        )

        return sources.map(source => source.id)
    }

    findRemoteSourceHarvestPositions(commune: Room, packedRemoteSources: Id<Source>[]) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest positions ' + this.room.name)

        const terrain = this.room.getTerrain()
        const sourceHarvestPositions: RoomPosition[][] = []

        for (const sourceID of packedRemoteSources) {
            const source = findObjectWithID(sourceID)
            const positions = []

            // Loop through each pos

            for (const pos of this.room.findAdjacentPositions(source.pos.x, source.pos.y)) {
                // Iterate if terrain for pos is a wall

                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

                // Add pos to harvestPositions

                positions.push(pos)
            }

            sortBy(
                positions,
                origin =>
                    customFindPath({
                        origin,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length,
            )

            sourceHarvestPositions.push(positions)
        }

        return sourceHarvestPositions.map(positions => packPosList(positions))
    }

    findRemoteSourcePaths(commune: Room, packedRemoteSourceHarvestPositions: string[]) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote source harvest paths' + this.room.name)

        const sourcePaths: RoomPosition[][] = []

        for (const positions of packedRemoteSourceHarvestPositions) {
            const origin = unpackPosAt(positions, 0)
            const path = customFindPath({
                origin,
                goals: [{ pos: anchor, range: 3 }],
                typeWeights: remoteTypeWeights,
                plainCost: defaultRoadPlanningPlainCost,
                weightStructurePlans: true,
                avoidStationaryPositions: true,
            })

            sourcePaths.push(path)
        }
        for (const index in sourcePaths) {
            const path = sourcePaths[index]
            if (!path.length) throw Error('no source path found for index ' + index + ' for ' + this.room.name + ', ' + sourcePaths)
        }

        return sourcePaths.map(path => packPosList(path))
    }

    findRemoteControllerPositions(commune: Room) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('no anchor found for controller positions ' + this.room.name)

        const positions: RoomPosition[] = []
        const controllerPos = this.room.controller.pos
        const terrain = this.room.getTerrain()

        for (let offset of adjacentOffsets) {
            const adjPos = new RoomPosition(offset.x + controllerPos.x, offset.y + controllerPos.y, this.room.name)

            if (terrain.get(adjPos.x, adjPos.y) === TERRAIN_MASK_WALL) continue

            positions.push(adjPos)
        }

        sortBy(
            positions,
            origin =>
                customFindPath({
                    origin,
                    goals: [{ pos: anchor, range: 3 }],
                }).length,
        )

        return packPosList(positions)
    }

    findRemoteControllerPath(commune: Room, packedRemoteControllerPositions: string) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for remote controller path' + this.room.name)

        const origin = unpackPosAt(packedRemoteControllerPositions, 0)
        const path = customFindPath({
            origin,
            goals: [{ pos: anchor, range: 3 }],
            typeWeights: remoteTypeWeights,
            plainCost: defaultRoadPlanningPlainCost,
            weightStructurePlans: true,
            avoidStationaryPositions: true,
        })
        if (!path.length) throw Error('No remote controller path for ' + this.room.name)

        return packPosList(path)
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

        const mineralID = Memory.rooms[this.room.name][RoomMemoryKeys.mineral]
        if (mineralID) return findObjectWithID(mineralID)

        const mineral = this.room.find(FIND_MINERALS)[0]
        Memory.rooms[this.room.name][RoomMemoryKeys.mineral] = mineral.id

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

        const packedStampAnchors = this.room.memory[RoomMemoryKeys.stampAnchors]
        if (!packedStampAnchors) return false

        return (this._stampAnchors = unpackStampAnchors(packedStampAnchors))
    }

    /**
     * Sources sorted by optimal commune utilization
     */
    _communeSources: Source[]
    get communeSources() {
        if (this._communeSources) return this._communeSources

        const sourceIDs = this.room.memory[RoomMemoryKeys.communeSources]
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

        const sourceIDs = this.room.memory[RoomMemoryKeys.remoteSources]
        if (sourceIDs) {
            this._remoteSources = []

            for (let i = 0; i < sourceIDs.length; i++) {
                const source = findObjectWithID(sourceIDs[i])

                source.remoteIndex = i
                this._remoteSources.push(source)
            }

            return this._remoteSources
        }

        throw Error('No remote sources ' + this.room.name)
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

        const packedSourceHarvestPositions = this.room.memory[RoomMemoryKeys.communeSourceHarvestPositions]

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

        const packedSourceHarvestPositions = this.room.memory[RoomMemoryKeys.remoteSourceHarvestPositions]
        if (packedSourceHarvestPositions) {
            return (this._remoteSourceHarvestPositions = packedSourceHarvestPositions.map(positions =>
                unpackPosList(positions),
            ))
        }

        throw Error('No remote source harvest positions ' + this.room.name)
    }

    _communeSourcePaths: RoomPosition[][]
    get communeSourcePaths() {
        if (this._communeSourcePaths) return this._communeSourcePaths

        const packedSourcePaths = this.room.memory[RoomMemoryKeys.communeSourcePaths]
        if (packedSourcePaths) {
            return (this._communeSourcePaths = packedSourcePaths.map(positions => unpackPosList(positions)))
        }

        throw Error('No commune source paths ' + this.room.name)
        return (this._communeSourcePaths = [])
    }

    _remoteSourcePaths: RoomPosition[][]
    get remoteSourcePaths() {
        if (this._remoteSourcePaths) return this._remoteSourcePaths

        const packedSourcePaths = this.room.memory[RoomMemoryKeys.remoteSourcePaths]
        if (packedSourcePaths) {
            return (this._remoteSourcePaths = packedSourcePaths.map(positions => unpackPosList(positions)))
        }

        throw Error('No remote source paths ' + this.room.name)
    }

    _centerUpgradePos: RoomPosition
    get centerUpgradePos() {
        if (this._centerUpgradePos) return this._centerUpgradePos

        const packedPos = Memory.rooms[this.room.name][RoomMemoryKeys.centerUpgradePos]
        if (packedPos) {
            return (this._centerUpgradePos = unpackPos(packedPos))
        }

        throw Error('No center upgrade pos ' + this.room.name)

        return this._centerUpgradePos
    }

    _upgradePositions: RoomPosition[]
    get upgradePositions() {
        if (this._upgradePositions) return this._upgradePositions

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

        sortBy(
            positions,
            origin =>
                customFindPath({
                    origin,
                    goals: [{ pos: anchor, range: 4 }],
                }).length,
        )

        // Make the closest pos the last to be chosen

        positions.push(positions.shift())

        // Make the center pos the first to be chosen (we want upgraders to stand on the container)

        positions.unshift(centerUpgradePos)

        return (this._upgradePositions = positions)
    }

    _mineralHarvestPositions: RoomPosition[]
    get mineralHarvestPositions() {
        if (this._mineralHarvestPositions) return this._mineralHarvestPositions

        const packedPositions = this.room.memory[RoomMemoryKeys.mineralPositions]
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

        const roomType = this.room.memory[RoomMemoryKeys.type]
        if (roomType === RoomTypes.commune) {
            const structures = this.structures
            const relevantStructures = (structures.container as (StructureContainer | StructureRoad)[]).concat(
                structures.road,
            )
            const basePlans = BasePlans.unpack(this.room.memory[RoomMemoryKeys.basePlans])
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
        if (roomType === RoomTypes.remote) {
            return (this._generalRepairStructures = generalRepairStructures)
        }

        // Non-commune non-remote

        return (this._generalRepairStructures = generalRepairStructures)
    }

    _remoteControllerPositions: RoomPosition[]
    get remoteControllerPositions() {
        if (this._remoteControllerPositions) return this._remoteControllerPositions

        const roomMemory = Memory.rooms[this.room.name]
        const packedRemoteControllerPositions = roomMemory[RoomMemoryKeys.remoteControllerPositions]
        if (packedRemoteControllerPositions) {
            return (this._remoteControllerPositions = unpackPosList(packedRemoteControllerPositions))
        }

        throw Error('No remote controller positions ' + this.room.name)
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

            const packedCoord = creep.memory[CreepMemoryKeys.packedCoord]
            if (!packedCoord) continue

            // The creep has a packedPos

            this._usedControllerCoords.add(packedCoord)
        }

        return this._usedControllerCoords
    }

    _remoteControllerPath: RoomPosition[]
    get remoteControllerPath() {
        if (this._remoteControllerPath) return this._remoteControllerPath

        const packedPath = this.room.memory[RoomMemoryKeys.remoteControllerPath]
        if (packedPath) {
            return (this._remoteControllerPath = unpackPosList(packedPath))
        }

        throw Error('No remote controller path ' + this.room.name)
    }

    _usedPositions: Set<string>
    get usedPositions() {
        if (this._usedPositions) return this._usedPositions

        return (this._usedPositions = new Set())
    }

    get cSiteTarget() {
        const roomMemory = Memory.rooms[this.room.name]
        if (roomMemory[RoomMemoryKeys.constructionSiteTarget]) {
            const cSiteTarget = findObjectWithID(roomMemory[RoomMemoryKeys.constructionSiteTarget])
            if (cSiteTarget) return cSiteTarget
        }

        if (!this.room.find(FIND_MY_CONSTRUCTION_SITES).length) return false

        let totalX = 0
        let totalY = 0
        let count = 1

        const anchor = this.anchor
        if (anchor) {
            totalX += anchor.x
            totalY += anchor.y
        } else {
            totalX += 25
            totalX += 25
        }

        for (const creepName of this.room.myCreeps.builder) {
            const pos = Game.creeps[creepName].pos

            totalX += pos.x
            totalY += pos.y
            count += 1
        }

        const searchAnchor = new RoomPosition(Math.floor(totalX / count), Math.floor(totalY / count), this.room.name)
        const cSites = this.cSites

        // Loop through structuretypes of the build priority

        for (const structureType of defaultStructureTypesByBuildPriority) {
            const cSitesOfType = cSites[structureType]
            if (!cSitesOfType.length) continue

            let target = searchAnchor.findClosestByPath(cSitesOfType, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: true,
                range: 3,
            })

            if (!target) target = findClosestObject(searchAnchor, cSitesOfType)

            roomMemory[RoomMemoryKeys.constructionSiteTarget] = target.id
            return target
        }

        return false
    }

    _usedStationaryCoords: Set<string>
    get usedStationaryCoords() {
        return (this._usedStationaryCoords = new Set())
    }

    allStructureIDs: Id<Structure<StructureConstant>>[]
    checkedStructureUpdate: boolean
    get structureUpdate() {
        if (this.checkedStructureUpdate === true) return false

        let newAllStructures: Structure[]

        if (this.allStructureIDs) {
            newAllStructures = this.room.find(FIND_STRUCTURES)

            if (newAllStructures.length === this.allStructureIDs.length) {
                const allStructures: Structure[] = []
                let change: true | undefined

                for (const ID of this.allStructureIDs) {
                    const structure = findObjectWithID(ID)
                    if (!structure) {
                        change = true
                        break
                    }

                    allStructures.push(structure)
                }

                if (!change && allStructures.length === this.allStructureIDs.length) {
                    return (this.checkedStructureUpdate = false)
                }
            }
        }

        // Structures have been added, destroyed or aren't yet initialized

        delete this._structureCoords

        if (!newAllStructures) newAllStructures = this.room.find(FIND_STRUCTURES)

        this.allStructureIDs = newAllStructures.map(structure => structure.id)
        return (this.checkedStructureUpdate = true)
    }

    _structureCoords: Map<string, Id<Structure<StructureConstant>>[]>
    get structureCoords() {
        if (this._structureCoords && !this.structureUpdate) return this._structureCoords

        // Construct storage of structures based on structureType

        const structureCoords: Map<string, Id<Structure<StructureConstant>>[]> = new Map()

        // Group structures by structureType

        for (const structure of this.room.find(FIND_STRUCTURES)) {
            const packedCoord = packCoord(structure.pos)

            const coordStructureIDs = structureCoords.get(packedCoord)
            if (!coordStructureIDs) {
                structureCoords.set(packedCoord, [structure.id])
                continue
            }
            coordStructureIDs.push(structure.id)
        }

        this._structureCoords = structureCoords
        return this._structureCoords
    }

    _structures: Partial<OrganizedStructures>
    get structures() {
        if (this._structures) return this._structures

        this._structures = {}
        for (const structureType of allStructureTypes) this._structures[structureType] = []

        // Group structures by structureType

        for (const structure of this.room.find(FIND_STRUCTURES))
            this._structures[structure.structureType].push(structure as any)

        return this._structures
    }

    cSiteIDs: Id<ConstructionSite<BuildableStructureConstant>>[]
    checkedCSiteUpdate: boolean
    get cSiteUpdate() {
        if (this.checkedCSiteUpdate === true) return false

        let newAllCSites: ConstructionSite[]

        if (this.cSiteIDs) {
            newAllCSites = this.room.find(FIND_CONSTRUCTION_SITES)

            if (newAllCSites.length === this.cSiteIDs.length) {
                const allCSites: ConstructionSite[] = []
                let change: true | undefined

                for (const ID of this.cSiteIDs) {
                    const cSite = findObjectWithID(ID)
                    if (!cSite) {
                        change = true
                        break
                    }

                    allCSites.push(cSite)
                }

                if (!change && allCSites.length === this.cSiteIDs.length) {
                    return (this.checkedCSiteUpdate = false)
                }
            }
        }

        // construction sites have been added, destroyed or aren't yet initialized

        delete this._cSiteCoords

        if (!newAllCSites) newAllCSites = this.room.find(FIND_CONSTRUCTION_SITES)

        this.cSiteIDs = newAllCSites.map(cSite => cSite.id)
        return (this.checkedCSiteUpdate = true)
    }

    _cSiteCoords: Map<string, Id<ConstructionSite<BuildableStructureConstant>>[]>
    get cSiteCoords() {
        if (this._cSiteCoords && !this.cSiteUpdate) return this._cSiteCoords

        // Construct storage of structures based on structureType

        const cSiteCoords: Map<string, Id<ConstructionSite<BuildableStructureConstant>>[]> = new Map()

        // Group structures by structureType

        for (const cSite of this.room.find(FIND_CONSTRUCTION_SITES)) {
            const packedCoord = packCoord(cSite.pos)

            const coordStructureIDs = cSiteCoords.get(packedCoord)
            if (!coordStructureIDs) {
                cSiteCoords.set(packedCoord, [cSite.id])
                continue
            }
            coordStructureIDs.push(cSite.id)
        }

        this._cSiteCoords = cSiteCoords
        return this._cSiteCoords
    }

    _cSites: Partial<Record<StructureConstant, ConstructionSite<BuildableStructureConstant>[]>>
    get cSites() {
        if (this._cSites) return this._cSites

        this._cSites = {}
        for (const structureType of allStructureTypes) this._cSites[structureType] = []

        // Group structures by structureType

        for (const cSite of this.room.find(FIND_CONSTRUCTION_SITES)) this._cSites[cSite.structureType].push(cSite)

        return this._cSites
    }
}
