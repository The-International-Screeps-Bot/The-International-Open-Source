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
    ReservedCoordTypes,
} from 'international/constants'
import {
    createPosMap,
    findClosestObject,
    findObjectWithID,
    findCoordsInsideRect,
    getRangeXY,
    unpackNumAsCoord,
    packAsNum,
    packXYAsNum,
    unpackNumAsPos,
    findCPUOf,
    areCoordsEqual,
    getRange,
    findHighestScore,
} from 'utils/utils'
import { collectiveManager } from 'international/collective'
import { profiler } from 'other/profiler'
import {
    packCoord,
    packCoordList,
    packPos,
    packPosList,
    packXYAsCoord,
    unpackCoord,
    unpackPosList,
} from 'other/codec'

const roomAdditions = {
    global: {
        get() {
            if (global[this.name]) return global[this.name]

            return (global[this.name] = {})
        },
    },

    // Got to here
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
    //
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
    //
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

            this._hubLink = this.findStructureInRange(
                stampAnchors.hub[0],
                1,
                structure => structure.structureType === STRUCTURE_LINK,
            )

            if (!this._hubLink) return (this._hubLink = false)

            this.global.hubLink = this._hubLink.id
            return this._hubLink
        },
    },
    //
    actionableWalls: {
        get() {
            if (this._actionableWalls) return this._actionableWalls

            return (this._actionableWalls = this.roomManager.structures.constructedWall.filter(
                function (structure) {
                    return structure.hits
                },
            ))
        },
    },
    //
    enemyDamageThreat: {
        get() {
            if (this._enemyDamageThreat !== undefined) return this._enemyDamageThreat

            if (this.controller && !this.controller.my && this.roomManager.structures.tower.length)
                return (this._enemyDamageThreat = true)

            for (const enemyAttacker of this.roomManager.enemyAttackers) {
                if (!enemyAttacker.combatStrength.melee && !enemyAttacker.combatStrength.ranged)
                    continue

                return (this._enemyDamageThreat = true)
            }

            return (this._enemyDamageThreat = false)
        },
    },
    //
    enemyThreatCoords: {
        get() {
            if (this._enemyThreatCoords) return this._enemyThreatCoords

            this._enemyThreatCoords = new Set()

            // If there is a controller, it's mine, and it's in safemode

            if (this.controller && this.controller.my && this.controller.safeMode)
                return this._enemyThreatCoords

            // If there is no enemy threat
            if (!this.roomManager.enemyAttackers.length) return this._enemyThreatCoords

            const enemyAttackers: Creep[] = []
            const enemyRangedAttackers: Creep[] = []

            for (const enemyCreep of this.roomManager.enemyAttackers) {
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
    //
    enemyThreatGoals: {
        get() {
            if (this._enemyThreatGoals) return this._enemyThreatGoals

            this._enemyThreatGoals = []

            for (const enemyCreep of this.roomManager.enemyAttackers) {
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
    //
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
    //
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
                        this._resourcesInStoringStructures[resourceType] =
                            structure.store[resourceType]
                        continue
                    }

                    this._resourcesInStoringStructures[resourceType] +=
                        structure.store[resourceType]
                }
            }

            return this._resourcesInStoringStructures
        },
    },
    //
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
    //
    advancedLogistics: {
        get() {
            if (this._advancedLogistics !== undefined) return this._advancedLogistics

            if (this.memory[RoomMemoryKeys.type] === RoomTypes.remote)
                return (this._advancedLogistics = true)

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

            for (const [packedCoord, coordType] of this.roomManager.reservedCoords) {
                if (coordType !== ReservedCoordTypes.important) continue

                const coord = unpackCoord(packedCoord)
                cm.set(coord.x, coord.y, 20)
            }

            for (const portal of this.roomManager.structures.portal)
                cm.set(portal.pos.x, portal.pos.y, 255)

            // Loop trough each construction site belonging to an ally

            for (const cSite of this.roomManager.notMyConstructionSites.ally)
                cm.set(cSite.pos.x, cSite.pos.y, 255)

            // The controller isn't in safemode or it isn't ours, avoid enemies

            if (!this.controller || !this.controller.safeMode || !this.controller.my) {
                for (const packedCoord of this.enemyThreatCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 255)
                }
            }

            if (!this.controller || !this.controller.safeMode) {
                for (const creep of this.roomManager.notMyCreeps.enemy)
                    cm.set(creep.pos.x, creep.pos.y, 255)
                for (const creep of this.roomManager.notMyCreeps.ally)
                    cm.set(creep.pos.x, creep.pos.y, 255)

                for (const creep of this.find(FIND_HOSTILE_POWER_CREEPS))
                    cm.set(creep.pos.x, creep.pos.y, 255)
            }

            for (const rampart of this.roomManager.structures.rampart) {
                // If the rampart is mine

                if (rampart.my) continue

                // If the rampart is public and owned by an ally
                // We don't want to try to walk through enemy public ramparts as it could trick our pathing

                if (rampart.isPublic && global.settings.allies.includes(rampart.owner.username))
                    continue

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
    //
    totalEnemyCombatStrength: {
        get() {
            if (this._totalEnemyCombatStrength) return this._totalEnemyCombatStrength

            this._totalEnemyCombatStrength = {
                melee: 0,
                ranged: 0,
                heal: 0,
                dismantle: 0,
            }

            for (const enemyCreep of this.roomManager.enemyAttackers) {
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
