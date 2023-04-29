import { RESULT_ACTION, RESULT_FAIL, RESULT_SUCCESS, RoomMemoryKeys } from 'international/constants'
import { updateStat } from 'international/statsManager'
import { getRangeXY, getRange } from 'international/utils'
import { reversePosList, unpackPos } from 'other/codec'

export class MineralHarvester extends Creep {
    preTickManager() {
        this.room.mineralHarvestStrength += this.parts.work * HARVEST_MINERAL_POWER
    }

    advancedHarvestMineral?(mineral: Mineral) {
        this.message = '🚬'

        // Unpack the creep's packedHarvestPos

        const harvestPos = this.findMineralHarvestPos()
        if (!harvestPos) return RESULT_FAIL

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

            return RESULT_ACTION
        }

        // Harvest the mineral, informing the result if it didn't succeed

        if (this.harvest(mineral) !== OK) return RESULT_FAIL

        // Find amount of minerals harvested and record it in data

        const mineralsHarvested = Math.min(this.parts.work * HARVEST_MINERAL_POWER, mineral.mineralAmount)
        this.reserveStore[mineral.mineralType] += mineralsHarvested
        updateStat(this.room.name, 'mh', mineralsHarvested)

        this.message = `⛏️${mineralsHarvested}`
        return RESULT_SUCCESS
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

            if (creep.advancedHarvestMineral(mineral) !== RESULT_SUCCESS) continue

            const mineralContainer = room.mineralContainer
            if (mineralContainer && creep.reserveStore[mineral.mineralType] >= creep.store.getCapacity()) {
                creep.transfer(mineralContainer, mineral.mineralType)
            }
        }
    }
}
