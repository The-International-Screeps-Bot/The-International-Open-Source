import {
    allStructureTypes,
    defaultRoadPlanningPlainCost,
    defaultSwampCost,
    impassibleStructureTypes,
    customColors,
    remoteTypeWeights,
    roomDimensions,
    defaultStructureTypesByBuildPriority,
    CreepMemoryKeys,
    RoomMemoryKeys,
    RoomTypes,
} from 'international/constants'
import {
    createPosMap,
    customLog,
    findClosestObject,
    findObjectWithID,
    findCoordsInsideRect,
    getRangeXY,
    unpackNumAsCoord,
    packAsNum,
    packXYAsNum,
    unpackNumAsPos,
    findFunctionCPU,
    areCoordsEqual,
    getRange,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { profiler } from 'other/profiler'
import { packCoord, packCoordList, packPos, packPosList, packXYAsCoord, unpackCoord, unpackPosList } from 'other/codec'

const roomAdditions = {
    global: {
        get() {
            if (global[this.name]) return global[this.name]

            return (global[this.name] = {})
        },
    },
    enemyCreeps: {
        get() {
            if (this._enemyCreeps) return this._enemyCreeps

            // If commune, only avoid ally creeps

            if (this.memory[RoomMemoryKeys.type] === RoomTypes.commune) {
                return (this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                    filter: creep => !Memory.allyPlayers.includes(creep.owner.username),
                }))
            }

            // In any other room avoid ally creeps and neutral creeps

            return (this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep =>
                    !Memory.allyPlayers.includes(creep.owner.username) &&
                    !Memory.nonAggressionPlayers.includes(creep.owner.username),
            }))
        },
    },
    enemyAttackers: {
        get() {
            if (this._enemyAttackers) return this._enemyAttackers

            // If commune, only avoid ally creeps

            if (this.memory[RoomMemoryKeys.type] === RoomTypes.commune) {
                return (this._enemyAttackers = this.enemyCreeps.filter(function (creep) {
                    return creep.parts.attack + creep.parts.ranged_attack + creep.parts.work + creep.parts.heal > 0
                }))
            }

            return (this._enemyAttackers = this.enemyCreeps.filter(function (creep) {
                return creep.parts.attack + creep.parts.ranged_attack + creep.parts.heal > 0
            }))
        },
    },
    allyCreeps: {
        get() {
            if (this._allyCreeps) return this._allyCreeps

            return (this._allyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => Memory.allyPlayers.includes(creep.owner.username),
            }))
        },
    },
    myDamagedCreeps: {
        get() {
            if (this._myDamagedCreeps) return this._myDamagedCreeps

            return (this._myDamagedCreeps = this._myDamagedCreeps =
                this.find(FIND_MY_CREEPS, {
                    filter: creep => creep.hits < creep.hitsMax,
                }))
        },
    },
    myDamagedPowerCreeps: {
        get() {
            if (this._myDamagedPowerCreeps) return this._myDamagedPowerCreeps

            return (this._myDamagedPowerCreeps = this._myDamagedPowerCreeps =
                this.find(FIND_MY_POWER_CREEPS, {
                    filter: creep => creep.hits < creep.hitsMax,
                }))
        },
    },
    allyDamagedCreeps: {
        get() {
            if (this._allyDamagedCreeps) return this._allyDamagedCreeps

            return (this._allyDamagedCreeps = this.allyCreeps.filter(creep => {
                return creep.hits < creep.hitsMax
            }))
        },
    },
    enemyCSites: {
        get() {
            if (this._enemyCSites) return this._enemyCSites

            return (this._enemyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => !Memory.allyPlayers.includes(cSite.owner.username),
            }))
        },
    },
    allyCSites: {
        get() {
            if (this._allyCSites) return this._allyCSites

            return (this._allyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => Memory.allyPlayers.includes(cSite.owner.username),
            }))
        },
    },
    allyCSitesByType: {
        get() {
            if (this._allyCSitesByType) return this._allyCSitesByType

            // Construct storage of structures based on structureType

            this._allyCSitesByType = {}

            // Make array keys for each structureType

            for (const structureType of allStructureTypes) this._allyCSitesByType[structureType] = []

            // Group cSites by structureType

            for (const cSite of this.allyCSites) this._allyCSitesByType[cSite.structureType].push(cSite)

            return this._allyCSitesByType
        },
    },
    spawningStructures: {
        get() {
            if (this._spawningStructures) return this._spawningStructures

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No anchor for spawning structures ' + this.name)

            this._spawningStructures = [
                ...this.roomManager.structures.spawn,
                ...this.roomManager.structures.extension,
            ].filter(structure => structure.RCLActionable)

            return this._spawningStructures
        },
    },
    spawningStructuresByPriority: {
        get() {
            if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

            this._spawningStructuresByPriority = []

            const structuresToWeight: SpawningStructures = []
            const sourceHarvestPositions = this.roomManager.communeSourceHarvestPositions

            /**
             * Check if the structure is for a source and add it if so
             */
            const isSourceStructure = (structure: StructureExtension | StructureSpawn) => {
                for (const i in sourceHarvestPositions) {
                    const pos = sourceHarvestPositions[i][0]

                    if (getRange(structure.pos, pos) > 1) continue

                    this._spawningStructuresByPriority.push(structure)
                    return true
                }

                return false
            }

            for (const structure of this.spawningStructures) {
                if (isSourceStructure(structure)) continue

                structuresToWeight.push(structure)
            }

            const anchor = this.roomManager.anchor
            if (!anchor) throw new Error('No anchor finding spawn structures priority ' + this.name)

            // Add in the non-source structures, by distance to anchor

            this._spawningStructuresByPriority = this._spawningStructuresByPriority.concat(
                structuresToWeight.sort(
                    (a, b) =>
                        getRangeXY(a.pos.x, anchor.x, a.pos.y, anchor.y) -
                        getRangeXY(b.pos.x, anchor.x, b.pos.y, anchor.y),
                ),
            )

            // Sort based on lowest range from the anchor

            return this._spawningStructuresByPriority
        },
    },
    spawningStructuresByNeed: {
        get() {
            if (this._spawningStructuresByNeed) return this._spawningStructuresByNeed

            this._spawningStructuresByNeed = this.spawningStructures

            // loop through sourceNames

            const sourceHarvestPositions = this.roomManager.communeSourceHarvestPositions
            for (const index in sourceHarvestPositions) {
                // Get the closestHarvestPos using the sourceName, iterating if undefined

                const closestSourcePos = sourceHarvestPositions[index][0]

                // Assign structuresForSpawning that are not in range of 1 to the closestHarvestPos

                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(
                    structure =>
                        getRangeXY(structure.pos.x, closestSourcePos.x, structure.pos.y, closestSourcePos.y) > 1,
                )
            }

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No anchor for spawning structures by need ' + this.name)

            if (
                anchor &&
                this.myCreeps.fastFiller.length &&
                ((this.controller.level >= 6 &&
                    this.fastFillerLink &&
                    this.hubLink &&
                    (this.storage || this.terminal) &&
                    this.myCreeps.hubHauler.length) ||
                    (this.fastFillerContainerLeft && this.fastFillerContainerRight))
            ) {
                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(
                    structure => getRangeXY(structure.pos.x, anchor.x, structure.pos.y, anchor.y) > 2,
                )
            }

            return this._spawningStructuresByNeed
        },
    },
    dismantleTargets: {
        get() {
            if (this._dismantleTargets) return this._dismantleTargets

            // We own the room, attack enemy owned structures

            if (this.controller && this.controller.my) {
                return (this._dismantleTargets = this.find(FIND_STRUCTURES, {
                    filter: structure =>
                        (structure as OwnedStructure).owner &&
                        !(structure as OwnedStructure).my &&
                        structure.structureType !== STRUCTURE_INVADER_CORE,
                }))
            }

            // We don't own the room, attack things that we can that aren't roads or containers

            return (this._dismantleTargets = this.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.structureType !== STRUCTURE_ROAD &&
                    structure.structureType !== STRUCTURE_CONTAINER &&
                    structure.structureType !== STRUCTURE_CONTROLLER &&
                    structure.structureType !== STRUCTURE_INVADER_CORE &&
                    structure.structureType !== STRUCTURE_KEEPER_LAIR &&
                    // We don't want to attack respawn or novice zone walls with infinite hits

                    structure.hits,
            }))
        },
    },
    destructableStructures: {
        get() {
            if (this._destructableStructures) return this._destructableStructures

            return (this._dismantleTargets = this.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.structureType !== STRUCTURE_CONTROLLER &&
                    structure.structureType !== STRUCTURE_INVADER_CORE,
            }))
        },
    },
    combatStructureTargets: {
        get() {
            if (this._combatStructureTargets) return this._combatStructureTargets

            this._combatStructureTargets = []

            if (this.controller) {
                if (this.controller.my || this.controller.reservation) return this._combatStructureTargets

                if (this.controller.owner && Memory.allyPlayers.includes(this.controller.owner.username))
                    return this._combatStructureTargets
                if (this.controller.reservation && Memory.allyPlayers.includes(this.controller.reservation.username))
                    return this._combatStructureTargets
            }

            const structures = this.roomManager.structures

            this._combatStructureTargets = this._combatStructureTargets.concat(structures.spawn)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.tower)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.extension)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.storage)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.terminal)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.powerSpawn)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.factory)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.nuker)
            this._combatStructureTargets = this._combatStructureTargets.concat(structures.observer)

            return this._combatStructureTargets
        },
    },
    usedSourceHarvestCoords: {
        get() {
            if (this._usedSourceHarvestCoords) return this._usedSourceHarvestCoords

            this._usedSourceHarvestCoords = new Set()

            for (const i in this.find(FIND_SOURCES)) {
                // Record used source coords

                for (const creepName of this.creepsOfSource[i]) {
                    const creep = Game.creeps[creepName]

                    // If the creep is isDying, iterate

                    if (creep.isDying()) continue
                    if (creep.memory[CreepMemoryKeys.sourceIndex] === undefined) continue
                    if (!creep.memory[CreepMemoryKeys.packedCoord]) continue

                    // If the creep has a packedHarvestPos, record it in usedHarvestPositions

                    this._usedSourceHarvestCoords.add(creep.memory[CreepMemoryKeys.packedCoord])
                }
            }

            return this._usedSourceHarvestCoords
        },
    },
    usedUpgradeCoords: {
        get() {
            if (this._usedUpgradeCoords) return this._usedUpgradeCoords

            this._usedUpgradeCoords = new Set()

            for (const creepName of this.myCreeps.controllerUpgrader) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is isDying, iterate

                if (creep.isDying()) continue

                const packedCoord = creep.memory[CreepMemoryKeys.packedCoord]
                if (!packedCoord) continue

                // The creep has a packedPos

                this._usedUpgradeCoords.add(packedCoord)
            }

            if (this.communeManager) {
                const controllerLink = this.communeManager.controllerLink
                if (controllerLink) this._usedUpgradeCoords.add(packCoord(controllerLink.pos))
            }
            /*
            for (const packedCoord of this._usedUpgradeCoords) {

                const coord = unpackCoord(packedCoord)

                this.visual.circle(coord.x, coord.y, { fill: customColors.red })
            }
 */
            return this._usedUpgradeCoords
        },
    },
    usedMineralCoords: {
        get() {
            if (this._usedMineralCoords) return this._usedMineralCoords

            this._usedMineralCoords = new Set()

            for (const creepName of this.myCreeps.mineralHarvester) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is isDying, iterate

                if (creep.isDying()) continue

                if (!creep.memory[CreepMemoryKeys.packedCoord]) continue

                // The creep has a packedPos

                this._usedMineralCoords.add(creep.memory[CreepMemoryKeys.packedCoord])
            }

            return this._usedMineralCoords
        },
    },
    fastFillerPositions: {
        get() {
            if (this._fastFillerPositions) return this._fastFillerPositions

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No anchor found for fast filler positions ' + this.name)

            this._fastFillerPositions = []

            const rawFastFillerPositions = [
                new RoomPosition(anchor.x - 1, anchor.y - 1, this.name),
                new RoomPosition(anchor.x - 1, anchor.y + 1, this.name),
                new RoomPosition(anchor.x + 1, anchor.y - 1, this.name),
                new RoomPosition(anchor.x + 1, anchor.y + 1, this.name),
            ]

            for (const fastFillerPos of rawFastFillerPositions) {
                const adjacentStructuresByType: Partial<Record<StructureConstant, number>> = {
                    spawn: 0,
                    extension: 0,
                    container: 0,
                    link: 0,
                }
                const adjacentCoords = findCoordsInsideRect(
                    fastFillerPos.x - 1,
                    fastFillerPos.y - 1,
                    fastFillerPos.x + 1,
                    fastFillerPos.y + 1,
                )

                // Check coords around the fast filler pos for relevant structures

                for (const coord of adjacentCoords) {
                    const structuresAtCoord = this.roomManager.structureCoords.get(packCoord(coord))
                    if (!structuresAtCoord) continue

                    for (const ID of structuresAtCoord) {
                        const structure = findObjectWithID(ID)

                        if (adjacentStructuresByType[structure.structureType] === undefined) continue

                        // Increase structure amount for this structureType on the adjacentPos

                        adjacentStructuresByType[structure.structureType] += 1
                    }
                }

                // If there is more than one adjacent extension and container, iterate

                if (adjacentStructuresByType[STRUCTURE_CONTAINER] + adjacentStructuresByType[STRUCTURE_LINK] === 0)
                    continue

                if (adjacentStructuresByType[STRUCTURE_SPAWN] + adjacentStructuresByType[STRUCTURE_EXTENSION] === 0)
                    continue

                this._fastFillerPositions.push(fastFillerPos)
            }

            return this._fastFillerPositions
        },
    },
    usedFastFillerCoords: {
        get() {
            if (this._usedFastFillerCoords) return this._usedFastFillerCoords

            this._usedFastFillerCoords = new Set()

            for (const creepName of this.myCreeps.fastFiller) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is isDying, iterate

                if (creep.isDying()) continue

                const packedCoord = creep.memory[CreepMemoryKeys.packedCoord]
                if (!packedCoord) continue

                // The creep has a packedPos

                this._usedFastFillerCoords.add(packedCoord)
            }

            return this._usedFastFillerCoords
        },
    },
    remoteNamesBySourceEfficacy: {
        get() {
            if (this._remoteNamesBySourceEfficacy) return this._remoteNamesBySourceEfficacy

            // Filter rooms that have some sourceEfficacies recorded

            this._remoteNamesBySourceEfficacy = this.memory[RoomMemoryKeys.remotes].filter(function (roomName) {
                return Memory.rooms[roomName][RoomMemoryKeys.remoteSourcePaths].length
            })

            // Sort the remotes based on the average source efficacy

            return this._remoteNamesBySourceEfficacy.sort(function (a1, b1) {
                return (
                    Memory.rooms[a1][RoomMemoryKeys.remoteSourcePaths].reduce((a2, b2) => a2 + b2.length, 0) /
                        Memory.rooms[a1][RoomMemoryKeys.remoteSourcePaths].length -
                    Memory.rooms[b1][RoomMemoryKeys.remoteSourcePaths].reduce((a2, b2) => a2 + b2.length, 0) /
                        Memory.rooms[b1][RoomMemoryKeys.remoteSourcePaths].length
                )
            })
        },
    },
    remoteSourceIndexesByEfficacy: {
        get() {
            if (this._remoteSourceIndexesByEfficacy) return this._remoteSourceIndexesByEfficacy

            this._remoteSourceIndexesByEfficacy = []

            for (const remoteName of this.memory[RoomMemoryKeys.remotes]) {
                const remoteMemory = Memory.rooms[remoteName]

                for (
                    let sourceIndex = 0;
                    sourceIndex < remoteMemory[RoomMemoryKeys.remoteSources].length;
                    sourceIndex++
                ) {
                    this._remoteSourceIndexesByEfficacy.push(remoteName + ' ' + sourceIndex)
                }
            }

            return this._remoteSourceIndexesByEfficacy.sort(function (a, b) {
                const aSplit = a.split(' ')
                const bSplit = b.split(' ')

                return (
                    Memory.rooms[aSplit[0]][RoomMemoryKeys.remoteSourcePaths][parseInt(aSplit[1])].length -
                    Memory.rooms[bSplit[0]][RoomMemoryKeys.remoteSourcePaths][parseInt(bSplit[1])].length
                )
            })
        },
    },
    sourceContainers: {
        get() {
            if (this._sourceContainers) return this._sourceContainers

            if (this.global.sourceContainers) {
                const sourceContainers: StructureContainer[] = []

                for (const ID of this.global.sourceContainers) {
                    const container = findObjectWithID(ID)
                    if (!container) break

                    sourceContainers.push(container)
                }

                if (sourceContainers.length === this.global.sourceContainers.length) {
                    return (this._sourceContainers = sourceContainers)
                }
            }

            const sourceContainers: StructureContainer[] = []

            const roomType = this.memory[RoomMemoryKeys.type]
            if (roomType === RoomTypes.commune) {
                const positions = this.roomManager.communeSourceHarvestPositions
                for (let i = 0; i < positions.length; i++) {
                    const structure = this.findStructureAtCoord(
                        positions[i][0],
                        structure => structure.structureType === STRUCTURE_CONTAINER,
                    )
                    if (!structure) continue

                    sourceContainers[i] = structure as StructureContainer
                }
            } else if (roomType === RoomTypes.remote) {
                const positions = this.roomManager.remoteSourceHarvestPositions
                for (let i = 0; i < positions.length; i++) {
                    const structure = this.findStructureAtCoord(
                        positions[i][0],
                        structure => structure.structureType === STRUCTURE_CONTAINER,
                    )
                    if (!structure) continue

                    sourceContainers[i] = structure as StructureContainer
                }
            } else {
                const positions = this.roomManager.sourceHarvestPositions
                for (let i = 0; i < positions.length; i++) {
                    const structure = this.findStructureAtCoord(
                        positions[i][0],
                        structure => structure.structureType === STRUCTURE_CONTAINER,
                    )
                    if (!structure) continue

                    sourceContainers[i] = structure as StructureContainer
                }
            }

            if (sourceContainers.length === this.find(FIND_SOURCES).length)
                this.global.sourceContainers = sourceContainers.map(container => container.id)
            return (this._sourceContainers = sourceContainers)
        },
    },
    fastFillerContainerLeft: {
        get() {
            if (this._fastFillerContainerLeft !== undefined) return this._fastFillerContainerLeft

            if (this.global.fastFillerContainerLeft) {
                const container = findObjectWithID(this.global.fastFillerContainerLeft)

                if (container) return (this._fastFillerContainerLeft = container)
            }

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No anchor found for fastFillerContainerLeft ' + this.name)

            const structure = this.findStructureAtXY(
                anchor.x - 2,
                anchor.y,
                structure => structure.structureType === STRUCTURE_CONTAINER,
            ) as StructureContainer | false
            this._fastFillerContainerLeft = structure

            if (!structure) return false

            this.global.fastFillerContainerLeft = structure.id
            return this._fastFillerContainerLeft
        },
    },
    fastFillerContainerRight: {
        get() {
            if (this._fastFillerContainerRight !== undefined) return this._fastFillerContainerRight

            if (this.global.fastFillerContainerRight) {
                const container = findObjectWithID(this.global.fastFillerContainerRight)
                if (container) return (this._fastFillerContainerRight = container)
            }

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No anchor found for fastFillerContainerLeft ' + this.name)

            const structure = this.findStructureAtXY(
                anchor.x + 2,
                anchor.y,
                structure => structure.structureType === STRUCTURE_CONTAINER,
            ) as StructureContainer | false
            this._fastFillerContainerRight = structure

            if (!structure) return false

            this.global.fastFillerContainerRight = structure.id
            return this._fastFillerContainerRight
        },
    },
    controllerContainer: {
        get() {
            if (this._controllerContainer !== undefined) return this._controllerContainer

            if (this.global.controllerContainer) {
                const container = findObjectWithID(this.global.controllerContainer)

                if (container) return container
            }

            const centerUpgradePos = this.roomManager.centerUpgradePos
            if (!centerUpgradePos) return false

            const structure = this.findStructureAtCoord(
                centerUpgradePos,
                structure => structure.structureType === STRUCTURE_CONTAINER,
            ) as StructureContainer | false
            this._controllerContainer = structure

            if (!structure) return false

            this.global.controllerContainer = structure.id as Id<StructureContainer>
            return this._controllerContainer
        },
    },
    mineralContainer: {
        get() {
            if (this._mineralContainer !== undefined) return this._mineralContainer

            if (this.global.mineralContainer) {
                const container = findObjectWithID(this.global.mineralContainer)

                if (container) return container
            }

            const mineralHarvestPos = this.roomManager.mineralHarvestPositions[0]
            if (!mineralHarvestPos) return false

            const structure = this.findStructureAtCoord(
                mineralHarvestPos,
                structure => structure.structureType === STRUCTURE_CONTAINER,
            ) as StructureContainer | false
            this._mineralContainer = structure

            if (!structure) return false

            this.global.mineralContainer = structure.id as Id<StructureContainer>
            return this._mineralContainer
        },
    },
    fastFillerLink: {
        get() {
            if (this._fastFillerLink !== undefined) return this._fastFillerLink

            if (this.global.fastFillerLink) {
                const container = findObjectWithID(this.global.fastFillerLink)

                if (container) return container
            }

            const anchor = this.roomManager.anchor
            if (!anchor) throw Error('No ancnhor found for fastFillerLink ' + this.name)

            const structure = this.findStructureAtCoord(
                anchor,
                structure => structure.structureType === STRUCTURE_LINK,
            ) as StructureLink | false
            this._fastFillerLink = structure

            if (!structure) return false

            this.global.fastFillerLink = structure.id as Id<StructureLink>
            return this._fastFillerLink
        },
    },
    hubLink: {
        get() {
            if (this._hubLink !== undefined) return this._hubLink

            if (this.global.hubLink) {
                const structure = findObjectWithID(this.global.hubLink)

                if (structure) return structure
            }

            const stampAnchors = this.roomManager.stampAnchors
            if (!stampAnchors) return (this._hubLink = false)

            this._hubLink = this.findStructureInsideRect(
                stampAnchors.hub[0].x - 1,
                stampAnchors.hub[0].y - 1,
                stampAnchors.hub[0].x + 1,
                stampAnchors.hub[0].y + 1,
                structure => structure.structureType === STRUCTURE_LINK,
            )

            if (!this._hubLink) return (this._hubLink = false)

            this.global.hubLink = this._hubLink.id
            return this._hubLink
        },
    },
    droppedEnergy: {
        get() {
            if (this._droppedEnergy) return this._droppedEnergy

            return (this._droppedEnergy = this.find(FIND_DROPPED_RESOURCES, {
                filter: resource =>
                    resource.resourceType === RESOURCE_ENERGY &&
                    !resource.room.enemyThreatCoords.has(packCoord(resource.pos)),
            }))
        },
    },
    droppedResources: {
        get() {
            if (this._droppedResources) return this._droppedResources

            return (this._droppedResources = this.find(FIND_DROPPED_RESOURCES, {
                filter: resource => !resource.room.enemyThreatCoords.has(packCoord(resource.pos)),
            }))
        },
    },
    actionableWalls: {
        get() {
            if (this._actionableWalls) return this._actionableWalls

            return (this._actionableWalls = this.roomManager.structures.constructedWall.filter(function (structure) {
                return structure.hits
            }))
        },
    },
    quadCostMatrix: {
        get() {
            if (this._quadCostMatrix) return this._quadCostMatrix

            const terrainCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))
            this._quadCostMatrix = new PathFinder.CostMatrix()

            const roadCoords = new Set()
            for (const road of this.roomManager.structures.road) roadCoords.add(packCoord(road.pos))

            // Avoid not my creeps

            for (const creep of this.enemyCreeps) terrainCoords[packAsNum(creep.pos)] = 255
            for (const creep of this.allyCreeps) terrainCoords[packAsNum(creep.pos)] = 255

            for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS)) terrainCoords[packAsNum(creep.pos)] = 255

            // Avoid impassible structures

            for (const rampart of this.roomManager.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // Otherwise if the rampart is owned by an ally, iterate

                if (rampart.isPublic) continue

                // Otherwise set the rampart's pos as impassible

                terrainCoords[packAsNum(rampart.pos)] = 255
            }

            // Loop through structureTypes of impassibleStructureTypes

            for (const structureType of impassibleStructureTypes) {
                for (const structure of this.roomManager.structures[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(structure.pos)] = 255
                }

                for (const cSite of this.roomManager.cSites[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(cSite.pos)] = 255
                }
            }

            //

            for (const portal of this.roomManager.structures.portal) terrainCoords[packAsNum(portal.pos)] = 255

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.allyCSites) terrainCoords[packAsNum(cSite.pos)] = 255

            let x

            // Configure y and loop through top exits

            let y = 0
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 100)

            // Configure x and loop through left exits

            x = 0
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 100)

            // Configure y and loop through bottom exits

            y = roomDimensions - 1
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 100)

            // Configure x and loop through right exits

            x = roomDimensions - 1
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 100)

            const terrainCM = this.getTerrain()

            // Assign impassible to tiles that aren't 2x2 passible

            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    const offsetCoords = [
                        {
                            x,
                            y,
                        },
                        {
                            x: x + 1,
                            y,
                        },
                        {
                            x,
                            y: y + 1,
                        },
                        {
                            x: x + 1,
                            y: y + 1,
                        },
                    ]

                    let largestValue = terrainCoords[packXYAsNum(x, y)]

                    for (const coord of offsetCoords) {
                        let coordValue = terrainCoords[packAsNum(coord)]
                        if (!coordValue || coordValue < 255) continue

                        if (roadCoords.has(packCoord(coord))) coordValue = 0
                        if (coordValue <= largestValue) continue

                        largestValue = coordValue
                    }

                    if (largestValue >= 50) {
                        this._quadCostMatrix.set(x, y, 50)

                        this._quadCostMatrix.set(
                            x,
                            y,
                            Math.max(terrainCoords[packXYAsNum(x, y)], Math.min(largestValue, 50)),
                        )
                        continue
                    }

                    largestValue = 0

                    for (const coord of offsetCoords) {
                        const value = terrainCM.get(coord.x, coord.y)
                        if (!value) continue

                        if (roadCoords.has(packCoord(coord))) continue
                        if (value !== TERRAIN_MASK_SWAMP) continue

                        largestValue = defaultSwampCost * 2
                    }

                    if (!largestValue) continue

                    for (const coord of offsetCoords) {
                        this._quadCostMatrix.set(coord.x, coord.y, largestValue)
                    }
                }
            }

            /* this.visualizeCostMatrix(this._quadCostMatrix) */

            return this._quadCostMatrix
        },
    },
    quadBulldozeCostMatrix: {
        get() {
            if (this._quadBulldozeCostMatrix) return this._quadBulldozeCostMatrix

            const terrainCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))
            this._quadBulldozeCostMatrix = new PathFinder.CostMatrix()

            const roadCoords = new Set()
            for (const road of this.roomManager.structures.road) roadCoords.add(packCoord(road.pos))

            // Avoid not my creeps
            /*
            for (const creep of this.enemyCreeps) terrainCoords[packAsNum(creep.pos)] = 255
            for (const creep of this.allyCreeps) terrainCoords[packAsNum(creep.pos)] = 255

            for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS)) terrainCoords[packAsNum(creep.pos)] = 255
 */
            // Avoid impassible structures

            for (const rampart of this.roomManager.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // Otherwise set the rampart's pos as impassible

                terrainCoords[packAsNum(rampart.pos)] = 50 /* rampart.hits / (rampart.hitsMax / 200) */
            }

            // Loop through structureTypes of impassibleStructureTypes

            for (const structureType of impassibleStructureTypes) {
                for (const structure of this.roomManager.structures[structureType]) {
                    terrainCoords[packAsNum(structure.pos)] = 10 /* structure.hits / (structure.hitsMax / 10) */
                }

                for (const cSite of this.roomManager.cSites[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(cSite.pos)] = 255
                }
            }

            //

            for (const portal of this.roomManager.structures.portal) terrainCoords[packAsNum(portal.pos)] = 255

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.allyCSites) terrainCoords[packAsNum(cSite.pos)] = 255

            let x

            // Configure y and loop through top exits

            let y = 0
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 50)

            // Configure x and loop through left exits

            x = 0
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 50)

            // Configure y and loop through bottom exits

            y = roomDimensions - 1
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 50)

            // Configure x and loop through right exits

            x = roomDimensions - 1
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 50)

            const terrainCM = this.getTerrain()

            // Assign impassible to tiles that aren't 2x2 passible

            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    const offsetCoords = [
                        {
                            x,
                            y,
                        },
                        {
                            x: x + 1,
                            y,
                        },
                        {
                            x,
                            y: y + 1,
                        },
                        {
                            x: x + 1,
                            y: y + 1,
                        },
                    ]

                    let largestValue = terrainCoords[packXYAsNum(x, y)]

                    for (const coord of offsetCoords) {
                        let coordValue = terrainCoords[packAsNum(coord)]
                        if (!coordValue || coordValue < 255) continue

                        if (roadCoords.has(packCoord(coord))) coordValue = 0
                        if (coordValue <= largestValue) continue

                        largestValue = coordValue
                    }

                    if (largestValue >= 50) {
                        this._quadBulldozeCostMatrix.set(x, y, 50)

                        this._quadBulldozeCostMatrix.set(
                            x,
                            y,
                            Math.max(terrainCoords[packXYAsNum(x, y)], Math.min(largestValue, 50)),
                        )
                        continue
                    }

                    largestValue = 0

                    for (const coord of offsetCoords) {
                        const value = terrainCM.get(coord.x, coord.y)
                        if (value === undefined) continue

                        if (roadCoords.has(packCoord(coord))) continue
                        if (value !== TERRAIN_MASK_SWAMP) continue

                        largestValue = defaultSwampCost * 2
                    }

                    if (!largestValue) continue

                    for (const coord of offsetCoords) {
                        this._quadBulldozeCostMatrix.set(coord.x, coord.y, largestValue)
                    }
                }
            }

            /* this.visualizeCostMatrix(this._quadBulldozeCostMatrix) */

            return this._quadBulldozeCostMatrix
        },
    },
    enemyDamageThreat: {
        get() {
            if (this._enemyDamageThreat !== undefined) return this._enemyDamageThreat

            if (this.controller && !this.controller.my && this.roomManager.structures.tower.length)
                return (this._enemyDamageThreat = true)

            for (const enemyAttacker of this.enemyAttackers) {
                if (!enemyAttacker.combatStrength.melee && !enemyAttacker.combatStrength.ranged) continue

                return (this._enemyDamageThreat = true)
            }

            return (this._enemyDamageThreat = false)
        },
    },
    enemyThreatCoords: {
        get() {
            if (this._enemyThreatCoords) return this._enemyThreatCoords

            this._enemyThreatCoords = new Set()

            // If there is a controller, it's mine, and it's in safemode

            if (this.controller && this.controller.my && this.controller.safeMode) return this._enemyThreatCoords

            // If there is no enemy threat

            if (!this.enemyAttackers.length) return this._enemyThreatCoords

            const enemyAttackers: Creep[] = []
            const enemyRangedAttackers: Creep[] = []

            for (const enemyCreep of this.enemyAttackers) {
                if (enemyCreep.parts.ranged_attack) {
                    enemyRangedAttackers.push(enemyCreep)
                    continue
                }

                if (enemyCreep.parts.attack > 0) enemyAttackers.push(enemyCreep)
            }

            for (const enemyAttacker of enemyAttackers) {
                // Construct rect and get positions inside

                const coords = findCoordsInsideRect(
                    enemyAttacker.pos.x - 2,
                    enemyAttacker.pos.y - 2,
                    enemyAttacker.pos.x + 2,
                    enemyAttacker.pos.y + 2,
                )

                for (const coord of coords) this._enemyThreatCoords.add(packCoord(coord))
            }

            for (const enemyAttacker of enemyRangedAttackers) {
                // Construct rect and get positions inside

                const coords = findCoordsInsideRect(
                    enemyAttacker.pos.x - 3,
                    enemyAttacker.pos.y - 3,
                    enemyAttacker.pos.x + 3,
                    enemyAttacker.pos.y + 3,
                )

                for (const coord of coords) this._enemyThreatCoords.add(packCoord(coord))
            }

            for (const rampart of this.roomManager.structures.rampart) {
                if (!rampart.my) continue
                if (rampart.hits < 3000) continue

                this._enemyThreatCoords.delete(packCoord(rampart.pos))
            }
            /*
            for (const packedCoord of this._enemyThreatCoords) {

                const coord = unpackCoord(packedCoord)

                this.visual.circle(coord.x, coord.y, { fill: customColors.red })
            }
 */
            return this._enemyThreatCoords
        },
    },
    enemyThreatGoals: {
        get() {
            if (this._enemyThreatGoals) return this._enemyThreatGoals

            this._enemyThreatGoals = []

            for (const enemyCreep of this.enemyAttackers) {
                if (enemyCreep.parts.ranged_attack) {
                    this._enemyThreatGoals.push({
                        pos: enemyCreep.pos,
                        range: 4,
                    })
                    continue
                }

                if (!enemyCreep.parts.attack) continue

                this._enemyThreatGoals.push({
                    pos: enemyCreep.pos,
                    range: 2,
                })
            }

            return this._enemyThreatGoals
        },
    },
    flags: {
        get() {
            if (this._flags) return this._flags

            this._flags = {}

            for (const flag of this.find(FIND_FLAGS)) {
                this._flags[flag.name as FlagNames] = flag
            }

            return this._flags
        },
    },
    factory: {
        get() {
            if (this._factory !== undefined) return this._factory

            return (this._factory = this.roomManager.structures.factory[0])
        },
    },
    powerSpawn: {
        get() {
            if (this._powerSpawn !== undefined) return this._powerSpawn

            return (this._powerSpawn = this.roomManager.structures.powerSpawn[0])
        },
    },
    nuker: {
        get() {
            if (this._nuker !== undefined) return this._nuker

            return (this._nuker = this.roomManager.structures.nuker[0])
        },
    },
    observer: {
        get() {
            if (this._observer !== undefined) return this._observer

            return (this._observer = this.roomManager.structures.observer[0])
        },
    },
    resourcesInStoringStructures: {
        get() {
            if (this._resourcesInStoringStructures) return this._resourcesInStoringStructures

            this._resourcesInStoringStructures = {}

            const storingStructures: AnyStoreStructure[] = [this.storage, this.factory]
            if (this.terminal && !this.terminal.effectsData.get(PWR_DISRUPT_TERMINAL))
                storingStructures.push(this.terminal)

            for (const structure of storingStructures) {
                if (!structure) continue
                if (!structure.RCLActionable) continue

                for (const key in structure.store) {
                    const resourceType = key as ResourceConstant

                    if (!this._resourcesInStoringStructures[resourceType]) {
                        this._resourcesInStoringStructures[resourceType] = structure.store[resourceType]
                        continue
                    }

                    this._resourcesInStoringStructures[resourceType] += structure.store[resourceType]
                }
            }

            return this._resourcesInStoringStructures
        },
    },
    unprotectedEnemyCreeps: {
        get() {
            if (this._unprotectedEnemyCreeps) return this._unprotectedEnemyCreeps

            const avoidStructureTypes = new Set([STRUCTURE_RAMPART])

            return (this._unprotectedEnemyCreeps = this.enemyCreeps.filter(enemyCreep => {
                return !this.coordHasStructureTypes(enemyCreep.pos, avoidStructureTypes)
            }))
        },
    },
    exitCoords: {
        get() {
            if (this._exitCoords) return this._exitCoords

            this._exitCoords = new Set()
            const terrain = this.getTerrain()

            let x
            let y = 0
            for (x = 0; x < roomDimensions; x += 1) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue
                this._exitCoords.add(packXYAsCoord(x, y))
            }

            // Configure x and loop through left exits

            x = 0
            for (y = 0; y < roomDimensions; y += 1) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue
                this._exitCoords.add(packXYAsCoord(x, y))
            }

            // Configure y and loop through bottom exits

            y = roomDimensions - 1
            for (x = 0; x < roomDimensions; x += 1) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue
                this._exitCoords.add(packXYAsCoord(x, y))
            }

            // Configure x and loop through right exits

            x = roomDimensions - 1
            for (y = 0; y < roomDimensions; y += 1) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue
                this._exitCoords.add(packXYAsCoord(x, y))
            }

            return this._exitCoords
        },
    },
    advancedLogistics: {
        get() {
            if (this._advancedLogistics !== undefined) return this._advancedLogistics

            if (this.memory[RoomMemoryKeys.type] === RoomTypes.remote) return (this._advancedLogistics = true)

            // So long as we have some sort of storing structure

            return (this._advancedLogistics = !!(
                this.fastFillerContainerLeft ||
                this.fastFillerContainerRight ||
                (this.controller.level >= 4 && this.storage) ||
                (this.controller.level >= 6 && this.terminal)
            ))
        },
    },
    defaultCostMatrix: {
        get() {
            if (this._defaultCostMatrix) return this._defaultCostMatrix
            /*
            if (this.global.defaultCostMatrix) {
                return (this._defaultCostMatrix = PathFinder.CostMatrix.deserialize(this.global.defaultCostMatrix))
            }
 */
            const cm = new PathFinder.CostMatrix()

            for (const road of this.roomManager.structures.road) cm.set(road.pos.x, road.pos.y, 1)

            for (const packedCoord of this.usedSourceHarvestCoords) {
                const coord = unpackCoord(packedCoord)
                cm.set(coord.x, coord.y, 20)
            }

            if (this.roomManager.anchor) {
                // The last upgrade position should be the deliver pos, which we want to weight normal

                for (const packedCoord of this.usedUpgradeCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 20)
                }

                for (const packedCoord of this.usedMineralCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 20)
                }

                const stampAnchors = this.roomManager.stampAnchors
                if (stampAnchors) cm.set(stampAnchors.hub[0].x, stampAnchors.hub[0].y, 20)

                // Loop through each position of fastFillerPositions, have creeps prefer to avoid

                for (const packedCoord of this.usedFastFillerCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 20)
                }
            }

            for (const portal of this.roomManager.structures.portal) cm.set(portal.pos.x, portal.pos.y, 255)

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.allyCSites) cm.set(cSite.pos.x, cSite.pos.y, 255)

            // The controller isn't in safemode or it isn't ours, avoid enemies

            if (!this.controller || !this.controller.safeMode || !this.controller.my) {
                for (const packedCoord of this.enemyThreatCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 255)
                }
            }

            if (!this.controller || !this.controller.safeMode) {
                for (const creep of this.enemyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)
                for (const creep of this.allyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)

                for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS)) cm.set(creep.pos.x, creep.pos.y, 255)
            }

            for (const rampart of this.roomManager.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // If the rampart is public and owned by an ally
                // We don't want to try to walk through enemy public ramparts as it could trick our pathing

                if (rampart.isPublic && Memory.allyPlayers.includes(rampart.owner.username)) continue

                // Otherwise set the rampart's pos as impassible

                cm.set(rampart.pos.x, rampart.pos.y, 255)
            }

            // Loop through structureTypes of impassibleStructureTypes

            for (const structureType of impassibleStructureTypes) {
                for (const structure of this.roomManager.structures[structureType]) {
                    // Set pos as impassible

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (const cSite of this.roomManager.cSites[structureType]) {
                    // Set pos as impassible

                    cm.set(cSite.pos.x, cSite.pos.y, 255)
                }
            }

            /* this.global.defaultCostMatrix = cm.serialize() */
            return (this._defaultCostMatrix = cm.clone())
        },
    },
    totalEnemyCombatStrength: {
        get() {
            if (this._totalEnemyCombatStrength) return this._totalEnemyCombatStrength

            this._totalEnemyCombatStrength = {
                melee: 0,
                ranged: 0,
                heal: 0,
                dismantle: 0,
            }

            for (const enemyCreep of this.enemyAttackers) {
                const combatStrength = enemyCreep.combatStrength
                this._totalEnemyCombatStrength.melee += combatStrength.melee
                this._totalEnemyCombatStrength.ranged += combatStrength.ranged
                this._totalEnemyCombatStrength.heal += combatStrength.heal
                this._totalEnemyCombatStrength.dismantle += combatStrength.dismantle
            }

            return this._totalEnemyCombatStrength
        },
    },
} as PropertyDescriptorMap & ThisType<Room>

profiler.registerObject(roomAdditions, 'roomAdditions')
Object.defineProperties(Room.prototype, roomAdditions)
