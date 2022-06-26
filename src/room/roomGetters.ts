import { allyList, constants } from 'international/constants'
import { findObjectWithID, getRange, unpackAsRoomPos } from 'international/generalFunctions'

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

               if (!this.memory.sourceIds) {
                    this.memory.sourceIds = []

                    for (const source of this.find(FIND_SOURCES)) this.memory.sourceIds.push(source.id)
               }

               this._sources = []

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
                    filter: creep => !allyList.has(creep.owner.username),
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
                    filter: creep => allyList.has(creep.owner.username),
               }))
          },
     },
     structures: {
          get() {
               if (this._structures) return this._structures

               // Construct storage of structures based on structureType

               this._structures = {}

               // Make array keys for each structureType

               for (const structureType of constants.allStructureTypes) this._structures[structureType] = []

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

               for (const structureType of constants.allStructureTypes) this._cSites[structureType] = []

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

               let cSitesOfType

               // Loop through structuretypes of the build priority

               for (const structureType of constants.structureTypesByBuildPriority) {
                    cSitesOfType = this.cSites[structureType]
                    if (!cSitesOfType.length) continue

                    const anchor = this.anchor || new RoomPosition(25, 25, this.name)

                    return (this.memory.cSiteTargetID = anchor.findClosestByRange(cSitesOfType).id)
               }

               return undefined
          },
     },
     spawningStructures: {
          get() {
               if (this._spawningStructures) return this._spawningStructures

               return (this._spawningStructures = this.get('spawn').concat(this.get('extension')))
          },
     },
     taskNeedingSpawningStructures: {
          get() {
               if (this._taskNeedingSpawningStructures) return this._taskNeedingSpawningStructures

               this._taskNeedingSpawningStructures = []

               let structuresAtPos

               for (const pos of this.global.stampAnchors.extensions) {
                    structuresAtPos = this.lookForAt(LOOK_STRUCTURES, pos)

                    for (const structure of structuresAtPos) {
                         if (
                              structure.structureType !== STRUCTURE_SPAWN &&
                              structure.structureType !== STRUCTURE_EXTENSION
                         )
                              continue

                         this._taskNeedingSpawningStructures.push(structure as StructureSpawn | StructureExtension)
                         break
                    }
               }

               for (const pos of this.global.stampAnchors.extension) {
                    structuresAtPos = this.lookForAt(LOOK_STRUCTURES, pos)

                    for (const structure of structuresAtPos) {
                         if (
                              structure.structureType !== STRUCTURE_SPAWN &&
                              structure.structureType !== STRUCTURE_EXTENSION
                         )
                              continue

                         this._taskNeedingSpawningStructures.push(structure as StructureSpawn | StructureExtension)
                         break
                    }
               }

               return this._taskNeedingSpawningStructures
          },
     },
     spawningStructuresByPriority: {
          get() {
               if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

               this._spawningStructuresByPriority = []

               // Fastfiller

               const adjacentStructures = this.lookForAtArea(
                    LOOK_STRUCTURES,
                    this.anchor.y - 2,
                    this.anchor.x - 2,
                    this.anchor.y + 2,
                    this.anchor.x + 2,
                    true,
               )

               let structureType

               for (const adjacentPosData of adjacentStructures) {
                    structureType = adjacentPosData.structure.structureType

                    if (structureType !== STRUCTURE_SPAWN && structureType !== STRUCTURE_EXTENSION) continue

                    this.spawningStructuresByPriority.push(
                         adjacentPosData.structure as StructureSpawn | StructureExtension,
                    )
               }

               const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

               for (const sourceName of sourceNames) {
                    // Get the closestHarvestPos using the sourceName, iterating if undefined

                    const closestHarvestPos: RoomPosition | undefined = this.get(`${sourceName}ClosestHarvestPos`)
                    if (!closestHarvestPos) continue

                    // Harvest extensions

                    const adjacentStructures = this.lookForAtArea(
                         LOOK_STRUCTURES,
                         closestHarvestPos.y - 1,
                         closestHarvestPos.x - 1,
                         closestHarvestPos.y + 1,
                         closestHarvestPos.x + 1,
                         true,
                    )

                    for (const adjacentPosData of adjacentStructures) {
                         const { structureType } = adjacentPosData.structure

                         if (structureType !== STRUCTURE_SPAWN && structureType !== STRUCTURE_EXTENSION) continue

                         this.spawningStructuresByPriority.push(
                              adjacentPosData.structure as StructureSpawn | StructureExtension,
                         )
                    }
               }

               // Assign taskNeedingSpawningStructures by lowest range from the anchor

               return this._spawningStructuresByPriority.concat(
                    this.taskNeedingSpawningStructures.sort(
                         (a, b) =>
                              getRange(a.pos.x - this.anchor.x, a.pos.y - this.anchor.y) -
                              getRange(b.pos.x - this.anchor.x, b.pos.y - this.anchor.y),
                    ),
               )
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.source1Container = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.source2Container = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.fastFillerContainerLeft = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.fastFillerContainerRight = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.controllerContainer = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_CONTAINER)
                         return (this.global.mineralContainer = structure.id as Id<StructureContainer>)
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
                    if (structure.structureType === STRUCTURE_LINK)
                         return (this.global.source1Link = structure.id as Id<StructureLink>)
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
                    if (structure.structureType === STRUCTURE_LINK)
                         return (this.global.source2Link = structure.id as Id<StructureLink>)
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
                    if (structure.structureType === STRUCTURE_LINK)
                         return (this.global.controllerLink = structure.id as Id<StructureLink>)
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
                    if (structure.structureType === STRUCTURE_LINK)
                         return (this.global.fastFillerLink = structure.id as Id<StructureLink>)
               }

               return false
          },
     },
     factory: {
          get() {
               if (this._factory) return this._factory

               return (this._factory = this.find(FIND_MY_STRUCTURES, {
                    filter: structure => structure.structureType === STRUCTURE_FACTORY,
               })[0] as StructureFactory)
          },
     },
     nuker: {
          get() {
               if (this._nuker) return this._nuker

               return (this._nuker = this.find(FIND_MY_STRUCTURES, {
                    filter: structure => structure.structureType === STRUCTURE_NUKER,
               })[0] as StructureNuker)
          },
     },
     powerSpawn: {
          get() {
               if (this._powerSpawn) return this._powerSpawn

               return (this._powerSpawn = this.find(FIND_MY_STRUCTURES, {
                    filter: structure => structure.structureType === STRUCTURE_POWER_SPAWN,
               })[0] as StructureNuker)
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
     MEWT: {
          get() {
               if (this._MEWT) return this._MEWT

               this._MEWT = [...this.droppedEnergy]

               if (this.source1Container) this._MEWT.push(this.source1Container)
               if (this.source2Container) this._MEWT.push(this.source2Container)

               return this._MEWT
          },
     },
     OEWT: {
          get() {
               if (this._OEWT) return this._OEWT

               this._OEWT = [this.storage, this.terminal, this.factory, this.nuker, this.powerSpawn]

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

               this._METT = [...this.structures.spawn, ...this.structures.extension, ...this.structures.tower]

               if (this.fastFillerContainerLeft) this._METT.push(this.fastFillerContainerLeft)
               if (this.fastFillerContainerRight) this._METT.push(this.fastFillerContainerRight)

               return this._METT
          },
     },
     MATT: {
          get() {
               if (this._MATT) return this._MATT

               this._MATT = this.METT

               return this._MATT
          },
     },
} as PropertyDescriptorMap & ThisType<Room>)
