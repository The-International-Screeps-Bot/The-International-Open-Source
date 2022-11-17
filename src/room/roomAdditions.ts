import {
    allStructureTypes,
    defaultRoadPlanningPlainCost,
    defaultSwampCost,
    impassibleStructureTypes,
    myColors,
    remoteTypeWeights,
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
    unpackNumAsCoord,
    packAsNum,
    packXYAsNum,
    unpackNumAsPos,
} from 'international/utils'
import { internationalManager } from 'international/internationalManager'
import {
    packCoord,
    packCoordList,
    packPos,
    packPosList,
    packXYAsCoord,
    unpackCoord,
    unpackPosList,
} from 'other/packrat'

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
                    ? unpackNumAsPos(this.memory.stampAnchors.fastFiller[0], this.name)
                    : undefined)
        },
    },
    sources: {
        get() {
            if (this._sources) return this._sources

            this._sources = []

            if (this.memory.SIDs) {
                for (const index in this.memory.SIDs) {
                    const source = findObjectWithID(this.memory.SIDs[index])

                    source.index = parseInt(index)
                    this._sources.push(source)
                }

                return this._sources
            }

            this.memory.SIDs = []

            const sources = this.find(FIND_SOURCES)

            for (const index in sources) {
                const source = sources[index]

                source.index = parseInt(index)

                this.memory.SIDs.push(source.id)
                this._sources.push(source)
            }

            return this._sources
        },
    },
    sourcesByEfficacy: {
        get() {
            if (this._sourcesByEfficacy) return this._sourcesByEfficacy

            this._sourcesByEfficacy = [].concat(this.sources)
            //console.log(this.name)
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

            // If commune, only avoid ally creeps

            if (this.memory.T === 'commune') {
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

            if (this.memory.T === 'commune') {
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
    structureCoords: {
        get() {
            if (this._structureCoords) return this._structureCoords

            // Construct storage of structures based on structureType

            this._structureCoords = new Map()

            // Group structures by structureType

            for (const structure of this.find(FIND_STRUCTURES)) {
                const packedCoord = packCoord(structure.pos)

                const coordStructureIDs = this._structureCoords.get(packedCoord)
                if (!coordStructureIDs) {
                    this._structureCoords.set(packedCoord, [structure.id])
                    continue
                }
                coordStructureIDs.push(structure.id)
            }

            return this._structureCoords
        },
    },
    structureCoordsByType: {
        get() {
            if (this._structureCoordsByType) return this._structureCoordsByType

            // Construct storage of structures based on structureType

            this._structureCoordsByType = {}

            // Make array keys for each structureType

            for (const structureType of allStructureTypes) this._structureCoordsByType[structureType] = new Map()

            // Group structures by structureType

            for (const structure of this.find(FIND_STRUCTURES))
                this._structureCoordsByType[structure.structureType].set(packCoord(structure.pos), structure.id)

            return this._structureCoordsByType
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
            if (this.memory.CSTID) {
                const cSiteTarget = findObjectWithID(this.memory.CSTID)
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

                this.memory.CSTID = target.id
                return target
            }

            return false
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
    dismantleTargets: {
        get() {
            if (this._dismantleTargets) return this._dismantleTargets

            return (this._dismantleTargets = this.find(FIND_STRUCTURES, {
                filter: structure =>
                    (structure as OwnedStructure).owner &&
                    !(structure as OwnedStructure).my &&
                    structure.structureType !== STRUCTURE_CONTROLLER &&
                    structure.structureType !== STRUCTURE_INVADER_CORE,
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

            if (this.controller && (this.controller.my || this.controller.reservation))
                return this._combatStructureTargets

            if (this.controller && this.controller.owner && Memory.allyPlayers.includes(this.controller.owner.username))
                return this._combatStructureTargets
            if (
                this.controller &&
                this.controller.reservation &&
                Memory.allyPlayers.includes(this.controller.reservation.username)
            )
                return this._combatStructureTargets

            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.spawn)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.tower)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.extension)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.storage)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.terminal)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.powerSpawn)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.factory)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.nuker)
            this._combatStructureTargets = this._combatStructureTargets.concat(this.structures.observer)

            return this._combatStructureTargets
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

            if (this.memory.T === 'remote') {
                const commune = Game.rooms[this.memory.CN]
                if (!commune) return []

                const anchor = commune.anchor || new RoomPosition(25, 25, commune.name)

                const terrainCoords = internationalManager.getTerrainCoords(this.name)

                for (const source of this.sources) {
                    const positions = []

                    // Loop through each pos

                    for (const pos of this.findAdjacentPositions(source.pos.x, source.pos.y)) {
                        // Iterate if terrain for pos is a wall

                        if (terrainCoords[packAsNum(pos)] === 255) continue

                        // Add pos to harvestPositions

                        positions.push(pos)
                    }

                    positions.sort((a, b) => {
                        return (
                            this.advancedFindPath({
                                origin: a,
                                goals: [{ pos: anchor, range: 3 }],
                            }).length -
                            this.advancedFindPath({
                                origin: b,
                                goals: [{ pos: anchor, range: 3 }],
                            }).length
                        )
                    })

                    this.memory.SP.push(packPosList(positions))
                    this._sourcePositions.push(positions)
                }

                return this._sourcePositions
            }

            const anchor = this.anchor || new RoomPosition(25, 25, this.name)

            const terrainCoords = internationalManager.getTerrainCoords(this.name)

            for (const source of this.sources) {
                const positions = []

                // Loop through each pos

                for (const pos of this.findAdjacentPositions(source.pos.x, source.pos.y)) {
                    // Iterate if terrain for pos is a wall

                    if (terrainCoords[packAsNum(pos)] === 255) continue

                    // Add pos to harvestPositions

                    positions.push(pos)
                }

                positions.sort((a, b) => {
                    return (
                        this.advancedFindPath({
                            origin: a,
                            goals: [{ pos: anchor, range: 3 }],
                        }).length -
                        this.advancedFindPath({
                            origin: b,
                            goals: [{ pos: anchor, range: 3 }],
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

            let harvesterNames
            if (this.memory.T === 'commune') {
                harvesterNames = this.myCreeps.source1Harvester
                if (this.sources.length >= 2) harvesterNames = harvesterNames.concat(this.myCreeps.source2Harvester)
                harvesterNames = harvesterNames.concat(this.myCreeps.vanguard)
            } else {
                harvesterNames = this.myCreeps.remoteSourceHarvester0
                if (this.sources.length >= 2)
                    harvesterNames = harvesterNames.concat(this.myCreeps.remoteSourceHarvester1)
            }

            for (const creepName of harvesterNames) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is dying, iterate

                if (creep.dying) continue

                if (creep.memory.SI === undefined) continue

                if (!creep.memory.PC) continue

                // If the creep has a packedHarvestPos, record it in usedHarvestPositions

                this._usedSourceCoords[creep.memory.SI].add(creep.memory.PC)
            }

            return this._usedSourceCoords
        },
    },
    sourcePaths: {
        get() {
            if (this._sourcePaths && this._sourcePaths.length) return this._sourcePaths

            this._sourcePaths = []

            if (this.memory.SPs && this.memory.SPs.length) {
                for (const path of this.memory.SPs) this._sourcePaths.push(unpackPosList(path))

                return this._sourcePaths
            }

            this.memory.SPs = []

            if (this.memory.T === 'remote') {
                const commune = Game.rooms[this.memory.CN]
                if (!commune) return []

                const sources = []
                    .concat(this.sourcePositions)
                    .sort((a, b) => {
                        return (
                            this.advancedFindPath({
                                origin: a[0],
                                goals: [{ pos: commune.anchor, range: 3 }],
                                typeWeights: remoteTypeWeights,
                                plainCost: defaultRoadPlanningPlainCost,
                                weightStructurePlans: true,
                                avoidStationaryPositions: true,
                            }).length -
                            this.advancedFindPath({
                                origin: b[0],
                                goals: [{ pos: commune.anchor, range: 3 }],
                                typeWeights: remoteTypeWeights,
                                plainCost: defaultRoadPlanningPlainCost,
                                weightStructurePlans: true,
                                avoidStationaryPositions: true,
                            }).length
                        )
                    })
                    .reverse()

                for (let index in sources) {
                    const path = this.advancedFindPath({
                        origin: this.sourcePositions[index][0],
                        goals: [{ pos: commune.anchor, range: 3 }],
                        typeWeights: remoteTypeWeights,
                        plainCost: defaultRoadPlanningPlainCost,
                        weightStructurePlans: true,
                        avoidStationaryPositions: true,
                    })

                    this._sourcePaths[index] = path
                    this.memory.SPs[index] = packPosList(path)
                }

                return this._sourcePaths
            }

            if (!this.anchor) return this._sourcePaths

            const sources = []
                .concat(this.sourcePositions)
                .sort((a, b) => {
                    return (
                        this.advancedFindPath({
                            origin: a[0],
                            goals: [{ pos: this.anchor, range: 3 }],
                            typeWeights: remoteTypeWeights,
                            plainCost: defaultRoadPlanningPlainCost,
                            weightStructurePlans: true,
                            avoidStationaryPositions: true,
                        }).length -
                        this.advancedFindPath({
                            origin: b[0],
                            goals: [{ pos: this.anchor, range: 3 }],
                            typeWeights: remoteTypeWeights,
                            plainCost: defaultRoadPlanningPlainCost,
                            weightStructurePlans: true,
                            avoidStationaryPositions: true,
                        }).length
                    )
                })
                .reverse()

            for (let index in sources) {
                const path = this.advancedFindPath({
                    origin: this.sourcePositions[index][0],
                    goals: [{ pos: this.anchor, range: 3 }],
                    typeWeights: remoteTypeWeights,
                    plainCost: defaultRoadPlanningPlainCost,
                    weightStructurePlans: true,
                    avoidStationaryPositions: true,
                })

                this._sourcePaths[index] = path
                this.memory.SPs[index] = packPosList(path)
            }

            return this._sourcePaths
        },
    },
    controllerPositions: {
        get() {
            if (this._controllerPositions) return this._controllerPositions

            if (this.memory.CP) {
                return (this._controllerPositions = unpackPosList(this.memory.CP))
            }

            this._controllerPositions = []
            const { controller } = this

            if (this.memory.T === 'remote') {
                const commune = Game.rooms[this.memory.CN]
                if (!commune) return undefined

                const terrainCoords = internationalManager.getTerrainCoords(this.name)

                const anchor = commune.anchor || new RoomPosition(25, 25, commune.name)

                // Find positions adjacent to source

                const adjacentPositions = this.findPositionsInsideRect(
                    controller.pos.x - 1,
                    controller.pos.y - 1,
                    controller.pos.x + 1,
                    controller.pos.y + 1,
                )

                for (const pos of adjacentPositions) {
                    // Iterate if terrain for pos is a wall

                    if (terrainCoords[packAsNum(pos)] === 255) continue

                    // Add pos to harvestPositions

                    this._controllerPositions.push(pos)
                }

                this._controllerPositions.sort((a, b) => {
                    return (
                        this.advancedFindPath({
                            origin: a,
                            goals: [{ pos: anchor, range: 3 }],
                        }).length -
                        this.advancedFindPath({
                            origin: b,
                            goals: [{ pos: anchor, range: 3 }],
                        }).length
                    )
                })

                this.memory.CP = packPosList(this._controllerPositions)
                return this._controllerPositions
            }

            const anchor = this.anchor || new RoomPosition(25, 25, this.name)

            const terrainCoords = internationalManager.getTerrainCoords(this.name)

            // Find positions adjacent to source

            const adjacentPositions = this.findPositionsInsideRect(
                controller.pos.x - 1,
                controller.pos.y - 1,
                controller.pos.x + 1,
                controller.pos.y + 1,
            )

            for (const pos of adjacentPositions) {
                // Iterate if terrain for pos is a wall

                if (terrainCoords[packAsNum(pos)] === 255) continue

                // Add pos to harvestPositions

                this._controllerPositions.push(pos)
            }

            this._controllerPositions.sort((a, b) => {
                return (
                    this.advancedFindPath({
                        origin: a,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length -
                    this.advancedFindPath({
                        origin: b,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length
                )
            })

            this.memory.CP = packPosList(this._controllerPositions)
            return this._controllerPositions
        },
    },
    centerUpgradePos: {
        get() {
            if (this.global.centerUpgradePos !== undefined) return this.global.centerUpgradePos

            if (!this.anchor) return false

            // Get the open areas in a range of 3 to the controller

            const distanceCoords = this.distanceTransform(
                undefined,
                false,
                255,
                this.controller.pos.x - 2,
                this.controller.pos.y - 2,
                this.controller.pos.x + 2,
                this.controller.pos.y + 2,
            )

            // Find the closest value greater than two to the centerUpgradePos and inform it

            return (this.global.centerUpgradePos = this.findClosestPosOfValue({
                coordMap: distanceCoords,
                startCoords: [this.anchor],
                requiredValue: 2,
                reduceIterations: 1,
                visuals: false,
                cardinalFlood: true,
            }))
        },
    },
    upgradePositions: {
        get() {
            if (this.global.upgradePositions) return this.global.upgradePositions

            // Get the center upgrade pos, stopping if it's undefined

            const centerUpgradePos = this.centerUpgradePos
            if (!centerUpgradePos) return []

            const anchor = this.anchor
            if (!anchor) return []

            this.global.upgradePositions = []

            // Find terrain in room

            const terrainCoords = internationalManager.getTerrainCoords(this.name)

            // Find positions adjacent to source

            const adjacentPositions = this.findAdjacentPositions(centerUpgradePos.x, centerUpgradePos.y)

            // Loop through each pos

            for (const pos of adjacentPositions) {
                // Iterate if terrain for pos is a wall

                if (terrainCoords[packAsNum(pos)] === 255) continue

                // Add pos to harvestPositions

                this.global.upgradePositions.push(pos)
            }

            this.global.upgradePositions.sort((a, b) => {
                return (
                    this.advancedFindPath({
                        origin: a,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length -
                    this.advancedFindPath({
                        origin: b,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length
                )
            })

            // Make the closest pos the last to be chosen

            this.global.upgradePositions.push(this.global.upgradePositions.shift())

            this.global.upgradePositions.splice(0, 0, centerUpgradePos)

            return this.global.upgradePositions
        },
    },
    usedUpgradePositions: {
        get() {
            if (this._usedUpgradePositions) return this._usedUpgradePositions

            this._usedUpgradePositions = new Set()

            for (const creepName of this.myCreeps.controllerUpgrader) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is dying, iterate

                if (creep.dying) continue

                if (!creep.memory.PC) continue

                // The creep has a packedPos

                this._usedUpgradePositions.add(creep.memory.PC)
            }

            // If a source container / link is nearby block the pos

            for (const container of this.sourceContainers) {
                this._usedUpgradePositions.add(packPos(container.pos))
            }
            for (const links of this.sourceLinks) {
                this._usedUpgradePositions.add(packPos(links.pos))
            }

            if (this.controllerLink) this._usedUpgradePositions.add(packPos(this.controllerLink.pos))
            /*
            for (const packedCoord of this._usedUpgradePositions) {

                const coord = unpackCoord(packedCoord)

                this.visual.circle(coord.x, coord.y, { fill: myColors.red })
            }
 */
            return this._usedUpgradePositions
        },
    },
    upgradePathLength: {
        get() {
            if (this.global.upgradePathLength) return this.global.upgradePathLength

            if (!this.anchor) return 0

            const centerUpgradePos = this.centerUpgradePos

            if (!centerUpgradePos) return 0

            return (this.global.upgradePathLength = this.advancedFindPath({
                origin: centerUpgradePos,
                goals: [{ pos: this.anchor, range: 3 }],
            }).length)
        },
    },
    mineralPositions: {
        get() {
            if (this._mineralPositions) return this._mineralPositions

            if (this.memory.MP) {
                return (this._mineralPositions = unpackPosList(this.memory.MP))
            }

            const anchor = this.anchor || new RoomPosition(25, 25, this.name)
            if (!anchor) return []

            this._mineralPositions = []
            const mineralPos = this.mineral.pos

            // Find positions adjacent to source

            const adjacentPositions = this.findPositionsInsideRect(
                mineralPos.x - 1,
                mineralPos.y - 1,
                mineralPos.x + 1,
                mineralPos.y + 1,
            )

            const terrainCoords = internationalManager.getTerrainCoords(this.name)

            // Loop through each pos

            for (const pos of adjacentPositions) {
                // Iterate if terrain for pos is a wall

                if (terrainCoords[packAsNum(pos)] === 255) continue

                // Add pos to harvestPositions

                this._mineralPositions.push(pos)
            }

            this._mineralPositions.sort((a, b) => {
                return (
                    this.advancedFindPath({
                        origin: a,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length -
                    this.advancedFindPath({
                        origin: b,
                        goals: [{ pos: anchor, range: 3 }],
                    }).length
                )
            })

            this.memory.MP = packPosList(this._mineralPositions)
            return this._mineralPositions
        },
    },
    usedMineralCoords: {
        get() {
            if (this._usedMineralCoords) return this._usedMineralCoords

            this._usedMineralCoords = new Set()

            for (const creepName of this.myCreeps.mineralHarvester) {
                // Get the creep using its name

                const creep = Game.creeps[creepName]

                // If the creep is dying, iterate

                if (creep.dying) continue

                if (!creep.memory.PC) continue

                // The creep has a packedPos

                this._usedMineralCoords.add(creep.memory.PC)
            }

            return this._usedMineralCoords
        },
    },
    fastFillerPositions: {
        get() {
            if (this._fastFillerPositions) return this._fastFillerPositions

            const anchor = this.anchor
            if (!anchor) return []

            this._fastFillerPositions = []

            const rawFastFillerPositions = [
                new RoomPosition(anchor.x - 1, anchor.y - 1, this.name),
                new RoomPosition(anchor.x - 1, anchor.y + 1, this.name),
                new RoomPosition(anchor.x + 1, anchor.y - 1, this.name),
                new RoomPosition(anchor.x + 1, anchor.y + 1, this.name),
            ]

            for (let index = rawFastFillerPositions.length - 1; index >= 0; index -= 1) {
                // Get the pos using the index

                const pos = rawFastFillerPositions[index]

                // Get adjacent structures

                const adjacentStructures = this.lookForAtArea(
                    LOOK_STRUCTURES,
                    pos.y - 1,
                    pos.x - 1,
                    pos.y + 1,
                    pos.x + 1,
                    true,
                )

                // Construct organized adjacent structures

                const adjacentStructuresByType: Partial<Record<StructureConstant, number>> = {
                    spawn: 0,
                    extension: 0,
                    container: 0,
                    link: 0,
                }

                // For each structure of adjacentStructures

                for (const adjacentPosData of adjacentStructures) {
                    // Get the structureType at the adjacentPos

                    const { structureType } = adjacentPosData.structure

                    if (adjacentStructuresByType[structureType] === undefined) continue

                    // Increase structure amount for this structureType on the adjacentPos

                    adjacentStructuresByType[structureType] += 1
                }

                // If there is more than one adjacent extension and container, iterate

                if (adjacentStructuresByType[STRUCTURE_CONTAINER] + adjacentStructuresByType[STRUCTURE_LINK] === 0)
                    continue

                if (adjacentStructuresByType[STRUCTURE_SPAWN] + adjacentStructuresByType[STRUCTURE_EXTENSION] === 0)
                    continue

                this._fastFillerPositions.push(pos)
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

                // If the creep is dying, iterate

                if (creep.dying) continue

                if (!creep.memory.PC) continue

                // The creep has a packedPos

                this._usedFastFillerCoords.add(creep.memory.PC)
            }

            return this._usedFastFillerCoords
        },
    },
    remoteNamesBySourceEfficacy: {
        get() {
            if (this._remoteNamesBySourceEfficacy) return this._remoteNamesBySourceEfficacy

            // Filter rooms that have some sourceEfficacies recorded

            this._remoteNamesBySourceEfficacy = this.memory.remotes.filter(function (roomName) {
                return Memory.rooms[roomName].SPs.length
            })

            // Sort the remotes based on the average source efficacy

            return this._remoteNamesBySourceEfficacy.sort(function (a1, b1) {
                return (
                    Memory.rooms[a1].SPs.reduce((a2, b2) => a2 + b2.length, 0) / Memory.rooms[a1].SPs.length -
                    Memory.rooms[b1].SPs.reduce((a2, b2) => a2 + b2.length, 0) / Memory.rooms[b1].SPs.length
                )
            })
        },
    },
    remoteSourceIndexesByEfficacy: {
        get() {
            if (this._remoteSourceIndexesByEfficacy) return this._remoteSourceIndexesByEfficacy

            this._remoteSourceIndexesByEfficacy = []

            for (const remoteName of this.memory.remotes) {
                const remoteMemory = Memory.rooms[remoteName]

                for (let sourceIndex = 0; sourceIndex < remoteMemory.SIDs.length; sourceIndex++) {
                    this._remoteSourceIndexesByEfficacy.push(remoteName + ' ' + sourceIndex)
                }
            }

            return this._remoteSourceIndexesByEfficacy.sort(function (a, b) {
                const aSplit = a.split(' ')
                const bSplit = b.split(' ')

                return (
                    Memory.rooms[aSplit[0]].SPs[parseInt(aSplit[1])].length -
                    Memory.rooms[bSplit[0]].SPs[parseInt(bSplit[1])].length
                )
            })
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

            const centerUpgradePos = this.centerUpgradePos
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

            const mineralHarvestPos = this.mineralPositions[0]
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

            const centerUpgradePos = this.centerUpgradePos
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
                const structure = findObjectWithID(this.global.hubLink)

                if (structure) return structure
            }

            if (!this.memory.stampAnchors.hub) return false

            const hubAnchor = unpackNumAsCoord(this.memory.stampAnchors.hub[0])
            if (!hubAnchor) return false
            //console.log(JSON.stringify(hubAnchor))
            for (const structure of new RoomPosition(hubAnchor.x, hubAnchor.y + 1, this.name).lookFor(
                LOOK_STRUCTURES,
            )) {
                if (structure.structureType !== STRUCTURE_LINK) continue

                this.global.hubLink = structure.id as Id<StructureLink>
                return structure
            }

            for (const structure of this.lookForAtArea(
                LOOK_STRUCTURES,
                hubAnchor.y - 1,
                hubAnchor.x - 1,
                hubAnchor.y + 1,
                hubAnchor.x + 1,
                true,
            )) {
                if (structure.structure.structureType !== STRUCTURE_LINK) continue

                this.global.hubLink = structure.structure.id as Id<StructureLink>
                return structure.structure
            }

            return false
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

            return (this._actionableWalls = this.structures.constructedWall.filter(function (structure) {
                return structure.hits
            }))
        },
    },
    quadCostMatrix: {
        get() {
            if (this._quadCostMatrix) return this._quadCostMatrix

            const terrainCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))
            this._quadCostMatrix = new PathFinder.CostMatrix()

            const roadCoods = new Set()
            for (const road of this.structures.road) roadCoods.add(packCoord(road.pos))

            // Avoid not my creeps

            for (const creep of this.enemyCreeps) terrainCoords[packAsNum(creep.pos)] = 255
            for (const creep of this.allyCreeps) terrainCoords[packAsNum(creep.pos)] = 255

            for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS)) terrainCoords[packAsNum(creep.pos)] = 255

            // Avoid impassible structures

            for (const rampart of this.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // Otherwise if the rampart is owned by an ally, iterate

                if (rampart.isPublic) continue

                // Otherwise set the rampart's pos as impassible

                terrainCoords[packAsNum(rampart.pos)] = 255
            }

            // Loop through structureTypes of impassibleStructureTypes

            for (const structureType of impassibleStructureTypes) {
                for (const structure of this.structures[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(structure.pos)] = 255
                }

                for (const cSite of this.cSites[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(cSite.pos)] = 255
                }
            }

            //

            for (const portal of this.structures.portal) terrainCoords[packAsNum(portal.pos)] = 255

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.allyCSites) terrainCoords[packAsNum(cSite.pos)] = 255

            let x

            // Configure y and loop through top exits

            let y = 0
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure x and loop through left exits

            x = 0
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure y and loop through bottom exits

            y = roomDimensions - 1
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure x and loop through right exits

            x = roomDimensions - 1
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

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
                        if (!coordValue || coordValue < 254) continue

                        if (roadCoods.has(packCoord(coord))) coordValue = 0

                        largestValue = Math.max(largestValue, coordValue)
                    }

                    if (largestValue >= 254) {
                        this._quadCostMatrix.set(x, y, 254)

                        this._quadCostMatrix.set(
                            x,
                            y,
                            Math.max(terrainCoords[packXYAsNum(x, y)], Math.min(largestValue, 254)),
                        )
                        continue
                    }

                    largestValue = 0

                    for (const coord of offsetCoords) {
                        const value = terrainCM.get(coord.x, coord.y)

                        if (roadCoods.has(packCoord(coord))) continue
                        if (value !== TERRAIN_MASK_SWAMP) continue

                        largestValue = defaultSwampCost * 2
                    }

                    if (!largestValue) continue

                    for (const coord of offsetCoords) {
                        this._quadCostMatrix.set(coord.x, coord.y, largestValue)
                    }
                }
            }

            /* this.visualizeCostMatrix(this._quadCostMatrix, true) */

            return this._quadCostMatrix
        },
    },
    quadBulldozeCostMatrix: {
        get() {
            if (this._quadBulldozeCostMatrix) return this._quadBulldozeCostMatrix

            const terrainCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))
            this._quadBulldozeCostMatrix = new PathFinder.CostMatrix()

            const roadCoods = new Set()
            for (const road of this.structures.road) roadCoods.add(packCoord(road.pos))

            // Avoid not my creeps
            /*
            for (const creep of this.enemyCreeps) terrainCoords[packAsNum(creep.pos)] = 255
            for (const creep of this.allyCreeps) terrainCoords[packAsNum(creep.pos)] = 255

            for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS)) terrainCoords[packAsNum(creep.pos)] = 255
 */
            // Avoid impassible structures

            for (const rampart of this.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // Otherwise set the rampart's pos as impassible

                terrainCoords[packAsNum(rampart.pos)] = 254 /* rampart.hits / (rampart.hitsMax / 200) */
            }

            // Loop through structureTypes of impassibleStructureTypes

            for (const structureType of impassibleStructureTypes) {
                for (const structure of this.structures[structureType]) {
                    terrainCoords[packAsNum(structure.pos)] = 10 /* structure.hits / (structure.hitsMax / 10) */
                }

                for (const cSite of this.cSites[structureType]) {
                    // Set pos as impassible

                    terrainCoords[packAsNum(cSite.pos)] = 255
                }
            }

            //

            for (const portal of this.structures.portal) terrainCoords[packAsNum(portal.pos)] = 255

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.allyCSites) terrainCoords[packAsNum(cSite.pos)] = 255

            let x

            // Configure y and loop through top exits

            let y = 0
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure x and loop through left exits

            x = 0
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure y and loop through bottom exits

            y = roomDimensions - 1
            for (x = 0; x < roomDimensions; x += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

            // Configure x and loop through right exits

            x = roomDimensions - 1
            for (y = 0; y < roomDimensions; y += 1)
                terrainCoords[packXYAsNum(x, y)] = Math.max(terrainCoords[packXYAsNum(x, y)], 254)

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
                        if (!coordValue || coordValue < 254) continue

                        if (roadCoods.has(packCoord(coord))) coordValue = 0

                        largestValue = Math.max(largestValue, coordValue)
                    }

                    if (largestValue >= 254) {
                        this._quadBulldozeCostMatrix.set(x, y, 254)

                        this._quadBulldozeCostMatrix.set(
                            x,
                            y,
                            Math.max(terrainCoords[packXYAsNum(x, y)], Math.min(largestValue, 254)),
                        )
                        continue
                    }

                    largestValue = 0

                    for (const coord of offsetCoords) {
                        const value = terrainCM.get(coord.x, coord.y)

                        if (roadCoods.has(packCoord(coord))) continue
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

            if (this.controller && !this.controller.my && this.structures.tower.length)
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

            for (const rampart of this.structures.rampart) {
                if (!rampart.my) continue
                if (rampart.hits < 3000) continue

                this._enemyThreatCoords.delete(packCoord(rampart.pos))
            }
            /*
            for (const packedCoord of this._enemyThreatCoords) {

                const coord = unpackCoord(packedCoord)

                this.visual.circle(coord.x, coord.y, { fill: myColors.red })
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
    defensiveRamparts: {
        get() {
            if (this._defensiveRamparts) return this._defensiveRamparts

            this._defensiveRamparts = []

            if (!this.anchor) return this._defensiveRamparts

            const ramparts = this.structures.rampart
            if (!ramparts.length) return this._defensiveRamparts

            // Construct a cost matrix for the flood

            const coordMap = new Uint8Array(internationalManager.getTerrainCoords(this.name))

            for (const road of this.structures.road) {
                coordMap[packAsNum(road.pos)] = 0
            }

            const rampartsByCoord: Map<number, Id<StructureRampart>> = new Map()

            for (const rampart of ramparts) {
                const packedCoord = packAsNum(rampart.pos)
                coordMap[packedCoord] = 254
                rampartsByCoord.set(packedCoord, rampart.id)
            }

            const visitedCoords = new Uint8Array(2500)

            // Construct values for the flood

            let depth = 0
            let thisGeneration: Coord[] = [this.anchor]
            let nextGeneration: Coord[] = []

            // Loop through positions of seeds

            for (const coord of thisGeneration) visitedCoords[packAsNum(coord)] = 1

            // So long as there are positions in this gen

            while (thisGeneration.length) {
                // Reset next gen

                nextGeneration = []

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    let isRampart: boolean

                    // For anything after the first generation

                    if (depth > 0) {
                        const packedCoord1 = packAsNum(coord1)

                        // Iterate if the terrain is a wall

                        if (coordMap[packedCoord1] === 255) continue

                        if (coordMap[packedCoord1] === 254) {
                            this._defensiveRamparts.push(findObjectWithID(rampartsByCoord.get(packedCoord1)))
                            isRampart = true
                        }
                    }

                    const generationAdditions = []
                    let foundRampart: boolean

                    // Loop through adjacent positions

                    for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
                        const packedCoord2 = packAsNum(coord2)

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (visitedCoords[packedCoord2] === 1) continue

                        if (isRampart) {
                            if (coordMap[packedCoord2] !== 254) continue
                            foundRampart = true
                        }

                        // Otherwise record that it has been visited

                        visitedCoords[packedCoord2] = 1

                        // Add it to the next gen

                        generationAdditions.push(coord2)
                    }

                    if (isRampart && !foundRampart) continue

                    nextGeneration = nextGeneration.concat(generationAdditions)
                }

                // Set this gen to next gen

                thisGeneration = nextGeneration

                // Increment depth

                depth += 1
            }

            return this._defensiveRamparts
        },
    },
    factory: {
        get() {
            if (this._factory !== undefined) return this._factory

            return (this._factory = this.structures.factory[0])
        },
    },
    powerSpawn: {
        get() {
            if (this._powerSpawn !== undefined) return this._powerSpawn

            return (this._powerSpawn = this.structures.powerSpawn[0])
        },
    },
    nuker: {
        get() {
            if (this._nuker !== undefined) return this._nuker

            return (this._nuker = this.structures.nuker[0])
        },
    },
    observer: {
        get() {
            if (this._observer !== undefined) return this._observer

            return (this._observer = this.structures.observer[0])
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
    MEWT: {
        get() {
            if (this._MEWT) return this._MEWT

            this._MEWT = [
                ...this.droppedEnergy,
                ...this.find(FIND_TOMBSTONES, {
                    filter: tombstone => tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
                }),
                //Priortize ruins that have short-ish life remaining over source containers
                //  So that we get all the resources out of the ruins
                ...this.find(FIND_RUINS).filter(
                    ru => ru.ticksToDecay < 10000 && ru.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
                ),
                ...this.sourceContainers,
                //But we still want to pull from ruins if the source containers are empty.
                ...this.find(FIND_RUINS).filter(
                    ru => ru.ticksToDecay >= 10000 && ru.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
                ),
                ...(this.find(FIND_HOSTILE_STRUCTURES).filter(structure => {
                    return (
                        (structure as any).store &&
                        (structure as any).store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
                        //And there's not a rampart on top of it...
                        !structure.pos
                            .lookFor(LOOK_STRUCTURES)
                            .filter(
                                structure2 =>
                                    structure2.structureType === STRUCTURE_RAMPART &&
                                    !(structure2 as StructureRampart).my,
                            )
                    )
                }) as AnyStoreStructure[]),
            ]

            return this._MEWT
        },
    },
    OEWT: {
        get() {
            if (this._OEWT) return this._OEWT

            this._OEWT = []

            if (this.storage && this.controller.level >= 4) {
                if (this.controller.my) this._OEWT.push(this.storage)
                // If it's not my controller but there are no enemy ramparts on the structure
                else if (
                    !this.storage.pos
                        .lookFor(LOOK_STRUCTURES)
                        .find(
                            structure =>
                                structure.structureType === STRUCTURE_RAMPART && !(structure as StructureRampart).my,
                        )
                )
                    this._OEWT.push(this.storage)
            }

            if (this.terminal && this.controller.level >= 6) {
                if (this.controller.my) this._OEWT.push(this.terminal)
                // If it's not my controller but there are no enemy ramparts on the structure
                else if (
                    !this.terminal.pos
                        .lookFor(LOOK_STRUCTURES)
                        .find(
                            structure =>
                                structure.structureType === STRUCTURE_RAMPART && !(structure as StructureRampart).my,
                        )
                )
                    this._OEWT.push(this.terminal)
            }

            return this._OEWT
        },
    },
    MAWT: {
        get() {
            if (this._MAWT) return this._MAWT
            this._MAWT = [
                ...this.droppedResources,
                ...this.find(FIND_TOMBSTONES).filter(cr => cr.store.getUsedCapacity() > 0),
                ...this.find(FIND_RUINS).filter(ru => ru.ticksToDecay < 10000 && ru.store.getUsedCapacity() > 0),
                ...this.sourceContainers.filter(
                    sc =>
                        sc.store.getUsedCapacity() >
                        _.sum(
                            _.filter(
                                Game.creeps,
                                c => c.memory.Rs && c.memory.Rs?.length > 0 && c.memory.Rs[0].targetID === sc.id,
                            ),
                            c => c.memory.Rs[0].amount,
                        ) +
                            50,
                ),
                ...(this.find(FIND_HOSTILE_STRUCTURES).filter(structure => {
                    return (
                        (structure as any).store &&
                        (structure as any).store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
                        //And there's not a rampart on top of it...
                        !structure.pos
                            .lookFor(LOOK_STRUCTURES)
                            .filter(
                                structure2 =>
                                    structure2.structureType === STRUCTURE_RAMPART &&
                                    !(structure2 as StructureRampart).my,
                            )
                    )
                }) as AnyStoreStructure[]),
            ]
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

                    if (creep.store.getCapacity() * 0.5 >= creep.store.getUsedCapacity()) this._METT.push(creep)
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

            if (this.storage && this.controller.level >= 4) this._OETT.push(this.storage)
            if (this.terminal && this.controller.level >= 6) this._OETT.push(this.terminal)

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
