import {
    allStructureTypes,
    allyList,
    myColors,
    roomDimensions,
    structureTypesByBuildPriority,
} from 'international/constants'
import {
    createPosMap,
    customLog,
    findClosestObject,
    findObjectWithID,
    findCoordsInsideRect,
    getRange,
    pack,
    packXY,
    unpackAsPos,
    unpackAsRoomPos,
} from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'
import { packCoordList, packPosList, unpackPosList } from 'other/packrat'

Object.defineProperties(Room.prototype, {
    global: {
        get() {
            if (global[this.name]) return global[this.name]

            return (global[this.name] = {})
        },
    },
    anchor: {
        get() {
            if (this._anchor) return this._anchor

            return (this._anchor =
                this.memory.stampAnchors && this.memory.stampAnchors.fastFiller.length
                    ? unpackAsRoomPos(this.memory.stampAnchors.fastFiller[0], this.name)
                    : undefined)
        },
    },
    sources: {
        get() {
            if (this._sources) return this._sources

            this._sources = []

            if (this.memory.sourceIds) {
                for (const index in this.memory.sourceIds) {
                    const source = findObjectWithID(this.memory.sourceIds[index])

                    source.index = parseInt(index)
                    this._sources.push(source)
                }

                return this._sources
            }

            this.memory.sourceIds = []

            const sources = this.find(FIND_SOURCES)

            for (const index in sources) {
                const source = sources[index]

                source.index = parseInt(index)

                this.memory.sourceIds.push(source.id)
                this._sources.push(source)
            }

            return this._sources
        },
    },
    sourcesByEfficacy: {
        get() {
            if (this._sourcesByEfficacy) return this._sourcesByEfficacy

            this._sourcesByEfficacy = [].concat(this.sources)

            return this._sourcesByEfficacy.sort((a, b) => {
                return this.sourcePaths[a.index].length - this.sourcePaths[b.index].length
            })
        },
    },
    mineral: {
        get() {
            if (this._mineral) return this._mineral

            return (this._mineral = this.find(FIND_MINERALS)[0])
        },
    },
    enemyCreeps: {
        get() {
            if (this._enemyCreeps) return this._enemyCreeps

            return (this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !Memory.allyList.includes(creep.owner.username),
            }))
        },
    },
    enemyAttackers: {
        get() {
            if (this._enemyAttackers) return this._enemyAttackers

            return this.enemyCreeps.filter(function (creep) {
                return creep.parts.attack + creep.parts.ranged_attack + creep.parts.work > 0
            })
        },
    },
    allyCreeps: {
        get() {
            if (this._allyCreeps) return this._allyCreeps

            return (this._allyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => Memory.allyList.includes(creep.owner.username),
            }))
        },
    },
    myDamagedCreeps: {
        get() {
            if (this._myDamagedCreeps) return this._myDamagedCreeps

            return (this._myDamagedCreeps = this.find(FIND_MY_CREEPS, {
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
    structures: {
        get() {
            if (this._structures) return this._structures

            // Construct storage of structures based on structureType

            this._structures = {}

            // Make array keys for each structureType

            for (const structureType of allStructureTypes) this._structures[structureType] = []

            // Group structures by structureType

            for (const structure of this.find(FIND_STRUCTURES))
                this._structures[structure.structureType].push(structure as any)

            return this._structures
        },
    },
    cSites: {
        get() {
            if (this._cSites) return this._cSites

            // Construct storage of structures based on structureType

            this._cSites = {}

            // Make array keys for each structureType

            for (const structureType of allStructureTypes) this._cSites[structureType] = []

            // Group cSites by structureType

            for (const cSite of this.find(FIND_MY_CONSTRUCTION_SITES)) this._cSites[cSite.structureType].push(cSite)

            return this._cSites
        },
    },
    cSiteTarget: {
        get() {
            if (this.memory.cSiteTargetID) {
                const cSiteTarget = findObjectWithID(this.memory.cSiteTargetID)
                if (cSiteTarget) return cSiteTarget
            }

            if (!this.find(FIND_MY_CONSTRUCTION_SITES).length) return false

            let totalX = 0
            let totalY = 0
            let count = 1

            if (this.anchor) {
                totalX += this.anchor.x
                totalY += this.anchor.y
            } else {
                totalX += 25
                totalX += 25
            }

            for (const creepName of this.myCreeps.builder) {
                const pos = Game.creeps[creepName].pos

                totalX += pos.x
                totalY += pos.y
                count += 1
            }

            const searchAnchor = new RoomPosition(Math.floor(totalX / count), Math.floor(totalY / count), this.name)

            // Loop through structuretypes of the build priority

            for (const structureType of structureTypesByBuildPriority) {
                const cSitesOfType = this.cSites[structureType]
                if (!cSitesOfType.length) continue

                let target = searchAnchor.findClosestByPath(cSitesOfType, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: true,
                    range: 3,
                })

                if (!target) target = findClosestObject(searchAnchor, cSitesOfType)

                this.memory.cSiteTargetID = target.id
                return target
            }

            return false
        },
    },
    enemyCSites: {
        get() {
            if (this._enemyCSites) return this._enemyCSites

            return (this._enemyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => !Memory.allyList.includes(cSite.owner.username),
            }))
        },
    },
    allyCSites: {
        get() {
            if (this._allyCSites) return this._allyCSites

            return (this._allyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => Memory.allyList.includes(cSite.owner.username),
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

            if (!this.anchor) return []

            return (this._spawningStructures = [...this.structures.spawn, ...this.structures.extension])
        },
    },
    spawningStructuresByPriority: {
        get() {
            if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

            // Sort based on lowest range from the anchor

            return (this._spawningStructuresByPriority = this.spawningStructures.sort(
                (a, b) =>
                    getRange(a.pos.x, this.anchor.x, a.pos.y, this.anchor.y) -
                    getRange(b.pos.x, this.anchor.x, b.pos.y, this.anchor.y),
            ))
        },
    },
    spawningStructuresByNeed: {
        get() {
            if (this._spawningStructuresByNeed) return this._spawningStructuresByNeed

            this._spawningStructuresByNeed = this.spawningStructures

            // loop through sourceNames

            for (const index in this.sources) {
                // Get the closestHarvestPos using the sourceName, iterating if undefined

                const closestSourcePos = this.sourcePositions[index][0]

                // Assign structuresForSpawning that are not in range of 1 to the closestHarvestPos

                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(
                    structure => getRange(structure.pos.x, closestSourcePos.x, structure.pos.y, closestSourcePos.y) > 1,
                )
            }

            if (
                this.anchor &&
                this.myCreeps.fastFiller.length &&
                ((this.fastFillerLink && this.hubLink && this.storage) ||
                    (this.fastFillerContainerLeft && this.fastFillerContainerRight))
            ) {
                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(
                    structure => getRange(structure.pos.x, this.anchor.x, structure.pos.y, this.anchor.y) > 2,
                )
            }

            return this._spawningStructuresByNeed
        },
    },
    sourcePositions: {
        get() {
            if (this._sourcePositions && this._sourcePositions.length) return this._sourcePositions

            if (this.memory.SP && this.memory.SP.length) {
                this._sourcePositions = []

                for (const positions of this.memory.SP) this._sourcePositions.push(unpackPosList(positions))

                return this._sourcePositions
            }

            this.memory.SP = []
            this._sourcePositions = []

            if (this.memory.type === 'remote') {
                const commune = Game.rooms[this.memory.commune]
                if (!commune) return []

                const terrain = Game.map.getRoomTerrain(this.name)

                const anchor = commune.anchor || new RoomPosition(25, 25, commune.name)

                for (const source of this.sources) {
                    const positions = []

                    // Find positions adjacent to source

                    const adjacentPositions = findCoordsInsideRect(
                        source.pos.x - 1,
                        source.pos.y - 1,
                        source.pos.x + 1,
                        source.pos.y + 1,
                    )

                    // Loop through each pos

                    for (const coord of adjacentPositions) {
                        // Iterate if terrain for pos is a wall

                        if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) continue

                        // Add pos to harvestPositions

                        positions.push(new RoomPosition(coord.x, coord.y, this.name))
                    }

                    positions.sort((a, b) => {
                        return (
                            this.advancedFindPath({
                                origin: a,
                                goal: { pos: anchor, range: 3 },
                            }).length -
                            this.advancedFindPath({
                                origin: b,
                                goal: { pos: anchor, range: 3 },
                            }).length
                        )
                    })

                    this.memory.SP.push(packPosList(positions))
                    this._sourcePositions.push(positions)
                }

                return this._sourcePositions
            }

            const anchor = this.anchor || new RoomPosition(25, 25, this.name)

            const terrain = Game.map.getRoomTerrain(this.name)

            for (const source of this.sources) {
                const positions = []

                // Find positions adjacent to source

                const adjacentPositions = findCoordsInsideRect(
                    source.pos.x - 1,
                    source.pos.y - 1,
                    source.pos.x + 1,
                    source.pos.y + 1,
                )

                // Loop through each pos

                for (const coord of adjacentPositions) {
                    // Iterate if terrain for pos is a wall

                    if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) continue

                    // Add pos to harvestPositions

                    positions.push(new RoomPosition(coord.x, coord.y, this.name))
                }

                positions.sort((a, b) => {
                    return (
                        this.advancedFindPath({
                            origin: a,
                            goal: { pos: anchor, range: 3 },
                        }).length -
                        this.advancedFindPath({
                            origin: b,
                            goal: { pos: anchor, range: 3 },
                        }).length
                    )
                })

                this.memory.SP.push(packPosList(positions))
                this._sourcePositions.push(positions)
            }

            return this._sourcePositions
        },
    },
    usedSourceCoords: {
        get() {
            if (this._usedSourceCoords) return this._usedSourceCoords

            this._usedSourceCoords = []

            for (const source of this.sources) this._usedSourceCoords.push(new Set())

            const harvesterNames =
                this.memory.type === 'commune'
                    ? this.myCreeps.source1Harvester
                          .concat(this.myCreeps.source2Harvester)
                          .concat(this.myCreeps.vanguard)
                    : this.myCreeps.source1RemoteHarvester.concat(this.myCreeps.source2RemoteHarvester)

            for (const creepName of harvesterNames) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is dying, iterate

                if (creep.isDying()) continue

                if (creep.memory.SI === undefined) continue

                if (!creep.memory.packedPos) continue

                // If the creep has a packedHarvestPos, record it in usedHarvestPositions

                this._usedSourceCoords[creep.memory.SI].add(creep.memory.packedPos)
            }

            return this._usedSourceCoords
        },
    },
    sourcePaths: {
        get() {
            if (this._sourcePaths?.length) return this._sourcePaths

            this._sourcePaths = []

            if (this.global.sourcePaths?.length) {
                for (const path of this.global.sourcePaths) this._sourcePaths.push(unpackPosList(path))

                return this._sourcePaths
            }

            this.global.sourcePaths = []

            if (this.memory.type === 'remote') {
                const commune = Game.rooms[this.memory.commune]
                if (!commune) return []

                for (const source of this.sources) {
                    const path = this.advancedFindPath({
                        origin: source.pos,
                        goal: { pos: commune.anchor, range: 3 },
                    })

                    this._sourcePaths.push(path)
                    this.global.sourcePaths.push(packPosList(path))
                }

                return this._sourcePaths
            }

            for (const source of this.sources) {
                const path = this.advancedFindPath({
                    origin: source.pos,
                    goal: { pos: this.anchor, range: 3 },
                })

                this._sourcePaths.push(path)
                this.global.sourcePaths.push(packPosList(path))
            }

            return this._sourcePaths
        },
    },
    upgradePathLength: {
        get() {
            if (this.global.upgradePathLength) return this.global.upgradePathLength

            if (!this.anchor) return 0

            const centerUpgradePos = this.get('centerUpgradePos')

            if (!centerUpgradePos) return 0

            return (this.global.upgradePathLength = this.advancedFindPath({
                origin: centerUpgradePos,
                goal: { pos: this.anchor, range: 3 },
            }).length)
        },
    },
    sourceContainers: {
        get() {
            if (this._sourceContainers) return this._sourceContainers

            if (this.global.sourceContainers) {
                const containers = []

                for (const ID of this.global.sourceContainers) {
                    const container = findObjectWithID(ID)
                    if (!container) break

                    containers.push(container)
                }

                if (containers.length === this.sources.length) return (this._sourceContainers = containers)
            }

            this.global.sourceContainers = []
            const containers = []

            for (const positions of this.sourcePositions) {
                for (let structure of positions[0].lookFor(LOOK_STRUCTURES) as StructureContainer[]) {
                    if (structure.structureType !== STRUCTURE_CONTAINER) continue

                    this.global.sourceContainers.push(structure.id)
                    containers.push(structure)
                    break
                }
            }

            return (this._sourceContainers = containers)
        },
    },
    sourceLinks: {
        get() {
            if (this._sourceLinks) return this._sourceLinks

            if (this.global.sourceLinks) {
                const links = []

                for (const ID of this.global.sourceLinks) {
                    const link = findObjectWithID(ID)
                    if (!link) break

                    links.push(link)
                }

                if (links.length === this.sources.length) return (this._sourceLinks = links)
            }

            this.global.sourceLinks = []
            const links = []

            for (const positions of this.sourcePositions) {
                const anchor = positions[0]

                const adjacentStructures = this.lookForAtArea(
                    LOOK_STRUCTURES,
                    anchor.y - 1,
                    anchor.x - 1,
                    anchor.y + 1,
                    anchor.x + 1,
                    true,
                )

                for (const posData of adjacentStructures) {
                    const structure = posData.structure as StructureLink

                    if (structure.structureType !== STRUCTURE_LINK) continue

                    this.global.sourceLinks.push(structure.id)
                    links.push(structure)
                    break
                }
            }

            return (this._sourceLinks = links)
        },
    },
    fastFillerContainerLeft: {
        get() {
            if (this.global.fastFillerContainerLeft) {
                const container = findObjectWithID(this.global.fastFillerContainerLeft)

                if (container) return container
            }

            if (!this.anchor) return false

            for (const structure of this.lookForAt(LOOK_STRUCTURES, this.anchor.x - 2, this.anchor.y)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.fastFillerContainerLeft = structure.id as Id<StructureContainer>
                return structure
            }

            return false
        },
    },
    fastFillerContainerRight: {
        get() {
            if (this.global.fastFillerContainerRight) {
                const container = findObjectWithID(this.global.fastFillerContainerRight)

                if (container) return container
            }

            if (!this.anchor) return false

            for (const structure of this.lookForAt(LOOK_STRUCTURES, this.anchor.x + 2, this.anchor.y)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.fastFillerContainerRight = structure.id as Id<StructureContainer>
                return structure
            }

            return false
        },
    },
    controllerContainer: {
        get() {
            if (this.global.controllerContainer) {
                const container = findObjectWithID(this.global.controllerContainer)

                if (container) return container
            }

            const centerUpgradePos: RoomPosition = this.get('centerUpgradePos')
            if (!centerUpgradePos) return false

            for (const structure of centerUpgradePos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.controllerContainer = structure.id as Id<StructureContainer>
                return structure
            }

            return false
        },
    },
    mineralContainer: {
        get() {
            if (this.global.mineralContainer) {
                const container = findObjectWithID(this.global.mineralContainer)

                if (container) return container
            }

            const mineralHarvestPos: RoomPosition = this.get('closestMineralHarvestPos')
            if (!mineralHarvestPos) return false

            for (const structure of mineralHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.mineralContainer = structure.id as Id<StructureContainer>
                return structure
            }

            return false
        },
    },
    controllerLink: {
        get() {
            if (this.global.controllerLink) {
                const container = findObjectWithID(this.global.controllerLink)

                if (container) return container
            }

            const centerUpgradePos = this.get('centerUpgradePos')

            if (!centerUpgradePos) return false

            for (const structure of centerUpgradePos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.controllerLink = structure.id as Id<StructureLink>
                return structure
            }

            return false
        },
    },
    fastFillerLink: {
        get() {
            if (this.global.fastFillerLink) {
                const container = findObjectWithID(this.global.fastFillerLink)

                if (container) return container
            }

            if (!this.anchor) return false

            for (const structure of this.anchor.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.fastFillerLink = structure.id as Id<StructureLink>
                return structure
            }

            return false
        },
    },
    hubLink: {
        get() {
            if (this.global.hubLink) {
                const container = findObjectWithID(this.global.hubLink)

                if (container) return container
            }

            if (!this.memory.stampAnchors.hub) return false

            const hubAnchor = unpackAsPos(this.memory.stampAnchors.hub[0])
            if (!hubAnchor) return false
            console.log(JSON.stringify(hubAnchor))
            for (const structure of new RoomPosition(hubAnchor.x - 1, hubAnchor.y - 1, this.name).lookFor(
                LOOK_STRUCTURES,
            )) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.hubLink = structure.id as Id<StructureLink>
                return structure
            }

            return false
        },
    },
    droppedEnergy: {
        get() {
            if (this._droppedEnergy) return this._droppedEnergy

            return (this._droppedEnergy = this.find(FIND_DROPPED_RESOURCES, {
                filter: resource => resource.resourceType === RESOURCE_ENERGY,
            }))
        },
    },
    actionableWalls: {
        get() {
            if (this._actionableWalls) return this._actionableWalls

            return (this._actionableWalls = this.structures.constructedWall.filter(function (structure) {
                return structure.hits
            }))
        },
    },
    MEWT: {
        get() {
            if (this._MEWT) return this._MEWT

            this._MEWT = [
                ...this.droppedEnergy,
                ...this.find(FIND_TOMBSTONES),
                ...this.find(FIND_RUINS),
                ...this.sourceContainers,
            ]

            return this._MEWT
        },
    },
    OEWT: {
        get() {
            if (this._OEWT) return this._OEWT

            this._OEWT = []

            if (this.storage) this._OEWT.push(this.storage)
            if (this.terminal) this._OEWT.push(this.terminal)

            return this._OEWT
        },
    },
    MAWT: {
        get() {
            if (this._MAWT) return this._MAWT

            this._MAWT = this.MEWT

            return this._MAWT
        },
    },
    OAWT: {
        get() {
            if (this._OAWT) return this._OAWT

            this._OAWT = this.OEWT

            return this._OAWT
        },
    },
    METT: {
        get() {
            if (this._METT) return this._METT

            this._METT = [...this.spawningStructuresByNeed]

            if (!this.fastFillerContainerLeft && !this.fastFillerContainerRight) {
                // Add builders that need energy

                for (const creepName of this.myCreeps.builder) {
                    const creep = Game.creeps[creepName]

                    if (creep.spawning) continue

                    if (creep.store.getCapacity() * 0.5 >= creep.usedStore()) this._METT.push(creep)
                }
            }

            // Add towers below half capacity

            this._METT = this._METT.concat(
                this.structures.tower.filter(tower => {
                    return tower.store.energy <= tower.store.getCapacity(RESOURCE_ENERGY) * 0.5
                }),
            )

            return this._METT
        },
    },
    OETT: {
        get() {
            if (this._OETT) return this._OETT

            this._OETT = []

            if (this.storage) this._OETT.push(this.storage)
            if (this.terminal) this._OETT.push(this.terminal)

            return this._OETT
        },
    },
    MATT: {
        get() {
            if (this._MATT) return this._MATT

            this._MATT = this.METT

            return this._MATT
        },
    },
    OATT: {
        get() {
            if (this._OATT) return this._OATT

            this._OATT = this.OETT

            return this._OATT
        },
    },
    MEFTT: {
        get() {
            if (this._MEFTT) return this._MEFTT

            this._MEFTT = []

            if (this.controllerContainer) this._MEFTT.push(this.controllerContainer)
            if (this.controllerLink && !this.hubLink) this._MEFTT.push(this.controllerLink)
            if (this.fastFillerContainerLeft) this._MEFTT.push(this.fastFillerContainerLeft)
            if (this.fastFillerContainerRight) this._MEFTT.push(this.fastFillerContainerRight)

            return this._MEFTT
        },
    },
    MOFTT: {
        get() {
            if (this._MOFTT) return this._MOFTT

            this._MOFTT = []

            return this._MOFTT
        },
    },
} as PropertyDescriptorMap & ThisType<Room>)
