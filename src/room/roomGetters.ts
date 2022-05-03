import { allyList, constants } from "international/constants"
import { getRange, unPackAsRoomPos } from "international/generalFunctions"

Object.defineProperties(Room.prototype, {

    global: {
        get() {

            if (global[this.name]) return global[this.name]

            return global[this.name] = {}
        }
    },
    anchor: {
        get() {

            if (this._anchor) return this._anchor

            return this._anchor = this.memory.stampAnchors?.fastFiller.length ? unPackAsRoomPos(this.memory.stampAnchors.fastFiller[0], this.name) :
                undefined
        }
    },
    enemyCreeps: {
        get() {

            if (this._enemyCreeps) return this._enemyCreeps

            return this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !allyList.has(creep.owner.username)
            })
        }
    },
    structures: {
        get() {

            if (this._structures) return this._structures

            // Construct storage of structures based on structureType

            this._structures = {}

            // Make array keys for each structureType

            for (const structureType of constants.allStructureTypes)
                this._structures[structureType] = []

            // Group structures by structureType

            for (const structure of this.find(FIND_STRUCTURES))
                this._structures[structure.structureType].push(structure)

            return this._structures
        }
    },
    cSites: {
        get() {

            if (this._cSites) return this._cSites

            // Construct storage of structures based on structureType

            this._cSites = {}

            // Make array keys for each structureType

            for (const structureType of constants.allStructureTypes)
                this._cSites[structureType] = []

            // Group cSites by structureType

            for (const cSite of this.find(FIND_MY_CONSTRUCTION_SITES))
                this._cSites[cSite.structureType].push(cSite)

            return this._cSites
        }
    },
    spawningStructures: {
        get() {

            if (this._spawningStructures) return this._spawningStructures

            return this._spawningStructures = this.get('spawn').concat(this.get('extension'))
        }
    },
    taskNeedingSpawningStructures: {
        get() {

            if (this._taskNeedingSpawningStructures) return this._taskNeedingSpawningStructures

            this._taskNeedingSpawningStructures = []

            for (const pos of this.global.stampAnchors.extensions) {

                const structuresAtPos = this.lookForAt(LOOK_STRUCTURES, pos)

                for (const structure of structuresAtPos) {

                    if (structure.structureType != STRUCTURE_SPAWN && structure.structureType != STRUCTURE_EXTENSION) continue

                    this._taskNeedingSpawningStructures.push(structure as StructureSpawn | StructureExtension)
                    break
                }
            }

            for (const pos of this.global.stampAnchors.extension) {

                const structuresAtPos = this.lookForAt(LOOK_STRUCTURES, pos)

                for (const structure of structuresAtPos) {

                    if (structure.structureType != STRUCTURE_SPAWN && structure.structureType != STRUCTURE_EXTENSION) continue

                    this._taskNeedingSpawningStructures.push(structure as StructureSpawn | StructureExtension)
                    break
                }
            }

            return this._taskNeedingSpawningStructures
        }
    },
    spawningStructuresByPriority: {
        get() {

            if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

            this._spawningStructuresByPriority = []

            // Fastfiller

            let adjacentStructures = this.lookForAtArea(LOOK_STRUCTURES, this.anchor.y - 2, this.anchor.x - 2, this.anchor.y + 2, this.anchor.x + 2, true)

            for (const adjacentPosData of adjacentStructures) {

                const structureType = adjacentPosData.structure.structureType

                if (structureType != STRUCTURE_SPAWN && structureType != STRUCTURE_EXTENSION) continue

                this.spawningStructuresByPriority.push(adjacentPosData.structure as StructureSpawn | StructureExtension)
            }

            const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

            for (const sourceName of sourceNames) {

                // Get the closestHarvestPos using the sourceName, iterating if undefined

                const closestHarvestPos: RoomPosition | undefined = this.get(`${sourceName}ClosestHarvestPos`)
                if (!closestHarvestPos) continue

                // Harvest extensions

                let adjacentStructures = this.lookForAtArea(LOOK_STRUCTURES, closestHarvestPos.y - 1, closestHarvestPos.x - 1, closestHarvestPos.y + 1, closestHarvestPos.x + 1, true)

                for (const adjacentPosData of adjacentStructures) {

                    const structureType = adjacentPosData.structure.structureType

                    if (structureType != STRUCTURE_SPAWN && structureType != STRUCTURE_EXTENSION) continue

                    this.spawningStructuresByPriority.push(adjacentPosData.structure as StructureSpawn | StructureExtension)
                }
            }

            // Assign taskNeedingSpawningStructures by lowest range from the anchor

            return this._spawningStructuresByPriority.concat(this.taskNeedingSpawningStructures.sort((a, b) =>
                getRange(a.pos.x - this.anchor.x, a.pos.y - this.anchor.y) - getRange(b.pos.x - this.anchor.x, b.pos.y - this.anchor.y)
            ))
        }
    },
    sourceHarvestPositions: {
        get() {

            if (this.global.sourceHarvestPositions) return this.global.sourceHarvestPositions

            const sourceHarvestPositions = [new Map()]

            return sourceHarvestPositions
        }
    }
} as PropertyDescriptorMap & ThisType<Room>)
