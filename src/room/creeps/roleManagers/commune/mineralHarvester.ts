import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    RoomMemoryKeys,
} from 'international/constants'
import { statsManager } from 'international/statsManager'
import { getRangeXY, getRange, areCoordsEqual } from 'utils/utils'
import { reversePosList, unpackPos } from 'other/codec'

export class MineralHarvester extends Creep {
    update() {
        const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
        if (packedCoord) {
            this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
        }
    }

    initRun() {
        this.room.communeManager.mineralHarvestStrength += this.parts.work * HARVEST_MINERAL_POWER
    }

    advancedHarvestMineral?(mineral: Mineral) {
        this.message = '🚬'

        // Unpack the creep's packedHarvestPos

        const harvestPos = this.findMineralHarvestPos()
        if (!harvestPos) return Result.fail

        this.actionCoord = this.room.roomManager.mineral.pos

        // If the creep is not standing on the harvestPos

        if (getRange(this.pos, harvestPos) > 0) {
            this.message = '⏩M'

            // Make a move request to it

            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [{ pos: harvestPos, range: 0 }],
                    avoidEnemyRanges: true,
                },
                {
                    packedPath: reversePosList(this.room.memory[RoomMemoryKeys.mineralPath]),
                    loose: true,
                },
            )

            return Result.action
        }

        // Harvest the mineral, informing the result if it didn't succeed

        if (this.harvest(mineral) !== OK) return Result.fail

        // Find amount of minerals harvested and record it in data

        const mineralsHarvested = Math.min(
            this.parts.work * HARVEST_MINERAL_POWER,
            mineral.mineralAmount,
        )
        this.reserveStore[mineral.mineralType] += mineralsHarvested
        statsManager.updateStat(this.room.name, 'mh', mineralsHarvested)

        this.message = `⛏️${mineralsHarvested}`
        return Result.success
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: MineralHarvester = Game.creeps[creepName]

            // Get the mineral

            const mineral = room.roomManager.mineral

            if (mineral.mineralAmount === 0) {
                creep.advancedRecycle()
                continue
            }

            if (creep.advancedHarvestMineral(mineral) !== Result.success) continue

            const mineralContainer = room.roomManager.mineralContainer
            if (
                mineralContainer &&
                // No need to transfer if we're on top of the container
                !areCoordsEqual(mineralContainer.pos, creep.pos) &&
                creep.reserveStore[mineral.mineralType] >= creep.store.getCapacity()
            ) {
                creep.transfer(mineralContainer, mineral.mineralType)
            }
        }
    }
}
