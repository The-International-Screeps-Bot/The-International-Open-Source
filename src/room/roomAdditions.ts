import { allStructureTypes, allyList, structureTypesByBuildPriority } from 'international/constants'
import {
    createPackedPosMap,
    customLog,
    findClosestObject,
    findObjectWithID,
    getRange,
    unpackAsPos,
    unpackAsRoomPos,
} from 'international/generalFunctions'

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

            if (!this.memory.sourceIds) {
                this.memory.sourceIds = []

                for (const source of this.find(FIND_SOURCES)) {
                    this.memory.sourceIds.push(source.id)
                    this._sources.push(source)
                }

                return this._sources
            }

            for (const sourceId of this.memory.sourceIds) this._sources.push(findObjectWithID(sourceId))

            return this._sources
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

            return (this._myDamagedCreeps = this.find(FIND_CREEPS, {
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

            // Loop through structuretypes of the build priority

            for (const structureType of structureTypesByBuildPriority) {
                const cSitesOfType = this.cSites[structureType]
                if (!cSitesOfType.length) continue

                const anchor = this.anchor || new RoomPosition(25, 25, this.name)

                return (this.memory.cSiteTargetID = findClosestObject(anchor, cSitesOfType).id)
            }

            return undefined
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

            const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

            // loop through sourceNames

            for (const sourceName of sourceNames) {
                // Get the closestHarvestPos using the sourceName, iterating if undefined

                let closestHarvestPos: RoomPosition = this.get(`${sourceName}ClosestHarvestPos`)

                if (!closestHarvestPos) continue

                // Assign structuresForSpawning that are not in range of 1 to the closestHarvestPos

                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(
                    structure =>
                        getRange(structure.pos.x, closestHarvestPos.x, structure.pos.y, closestHarvestPos.y) > 1,
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
    sourceHarvestPositions: {
        get() {
            if (this.global.sourceHarvestPositions) return this.global.sourceHarvestPositions

            const sourceHarvestPositions = [new Map()]

            return sourceHarvestPositions
        },
    },
    rampartPlans: {
        get() {
            if (this._rampartPlans) return this._rampartPlans

            return (this._rampartPlans = new PathFinder.CostMatrix())
        },
    },
    source1PathLength: {
        get() {
            if (this.global.source1PathLength) return this.global.source1PathLength

            if (!this.sources[0]) return 0

            if (!this.anchor) return 0

            return (this.global.source1PathLength = this.advancedFindPath({
                origin: this.sources[0].pos,
                goal: { pos: this.anchor, range: 3 },
            }).length)
        },
    },
    source2PathLength: {
        get() {
            if (this.global.source2PathLength) return this.global.source2PathLength

            if (!this.sources[1]) return 0

            if (!this.anchor) return 0

            return (this.global.source2PathLength = this.advancedFindPath({
                origin: this.sources[1].pos,
                goal: { pos: this.anchor, range: 3 },
            }).length)
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
    source1Container: {
        get() {
            if (this.global.source1Container) {
                const container = findObjectWithID(this.global.source1Container)

                if (container) return container
            }

            const closestHarvestPos: RoomPosition | undefined = this.get('source1ClosestHarvestPos')
            if (!closestHarvestPos) return false

            for (const structure of closestHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.source1Container = structure.id as Id<StructureContainer>
                return structure
            }

            return false
        },
    },
    source2Container: {
        get() {
            if (this.global.source2Container) {
                const container = findObjectWithID(this.global.source2Container)

                if (container) return container
            }

            const closestHarvestPos: RoomPosition | undefined = this.get('source2ClosestHarvestPos')
            if (!closestHarvestPos) return false

            for (const structure of closestHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER) continue

                this.global.source2Container = structure.id as Id<StructureContainer>
                return structure
            }

            return false
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
    source1Link: {
        get() {
            if (this.global.source1Link) {
                const container = findObjectWithID(this.global.source1Link)

                if (container) return container
            }

            const closestHarvestPos = this.get('source1ClosestHarvestPos')

            if (!closestHarvestPos) return false

            for (const structure of closestHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.source1Link = structure.id as Id<StructureLink>
                return structure
            }

            return false
        },
    },
    source2Link: {
        get() {
            if (this.global.source2Link) {
                const container = findObjectWithID(this.global.source2Link)

                if (container) return container
            }

            const closestHarvestPos = this.get('source2ClosestHarvestPos')

            if (!closestHarvestPos) return false

            for (const structure of closestHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.source2Link = structure.id as Id<StructureLink>
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

            let hubAnchor = unpackAsPos(this.memory.stampAnchors.hub[0])

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
    creepPositions: {
        get() {
            if (this._creepPositions) return this._creepPositions

            return (this._creepPositions = createPackedPosMap())
        },
    },
    moveRequests: {
        get() {
            if (this._moveRequests) return this._moveRequests

            return (this._moveRequests = createPackedPosMap(true))
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

            this._MEWT = [...this.droppedEnergy, ...this.find(FIND_TOMBSTONES), ...this.find(FIND_RUINS)]

            if (this.source1Container) this._MEWT.push(this.source1Container)
            if (this.source2Container) this._MEWT.push(this.source2Container)

            return this._MEWT
        },
    },
    OEWT: {
        get() {
            if (this._OEWT) return this._OEWT

            this._OEWT = []

            if (this.storage) this._OEWT.push(this.storage)
            if (this.terminal) this._OEWT.push(this.terminal)
            if (this.structures.factory[0]) this._OEWT.push(this.structures.factory[0])
            if (this.structures.nuker[0]) this._OEWT.push(this.structures.nuker[0])
            if (this.structures.powerSpawn[0]) this._OEWT.push(this.structures.powerSpawn[0])

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

            this._METT = [...this.spawningStructuresByNeed, ...this.structures.tower]

            if (!this.fastFillerContainerLeft && !this.fastFillerContainerRight) {
                // Add builders that need energy

                for (const creepName of this.myCreeps.builder) {
                    const creep = Game.creeps[creepName]

                    if (creep.spawning) continue

                    if (creep.store.getCapacity() * 0.5 >= creep.usedStore()) this._METT.push(creep)
                }
            }

            return this._METT
        },
    },
    OETT: {
        get() {
            if (this._OETT) return this._OETT

            this._OETT = []

            if (this.storage) this._OETT.push(this.storage)
            if (this.terminal) this._OETT.push(this.terminal)
            if (this.structures.factory[0]) this._OETT.push(this.structures.factory[0])
            if (this.structures.nuker[0]) this._OETT.push(this.structures.nuker[0])
            if (this.structures.powerSpawn[0]) this._OETT.push(this.structures.powerSpawn[0])

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
        }
    },
} as PropertyDescriptorMap & ThisType<Room>)
