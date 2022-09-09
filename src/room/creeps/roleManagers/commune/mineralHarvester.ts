import { getRange, unpackAsRoomPos } from 'international/generalFunctions'

export class MineralHarvester extends Creep {
    advancedHarvestMineral?(mineral: Mineral): boolean {
        const creep = this
        const { room } = creep

        // Try to find a harvestPosition, inform false if it failed

        if (!creep.findMineralHarvestPos()) return false

        creep.say('🚬')

        // Unpack the creep's packedHarvestPos

        const harvestPos = unpackAsRoomPos(creep.memory.packedPos, room.name)

        // If the creep is not standing on the harvestPos

        if (getRange(creep.pos.x, harvestPos.x, creep.pos.y, harvestPos.y) > 0) {
            creep.say('⏩M')

            // Make a move request to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: harvestPos, range: 0 }],
                avoidEnemyRanges: true,
            })

            // And inform false

            return false
        }

        // Harvest the mineral, informing the result if it didn't succeed

        if (creep.harvest(mineral) !== OK) return false

        // Find amount of minerals harvested and record it in data

        const mineralsHarvested = Math.min(this.parts.work * HARVEST_POWER, mineral.mineralAmount)
        if (global.roomStats.commune[this.room.name])
            (global.roomStats.commune[this.room.name] as RoomCommuneStats).mh += mineralsHarvested

        creep.say(`⛏️${mineralsHarvested}`)

        // Inform true

        return true
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static mineralHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: MineralHarvester = Game.creeps[creepName]

            // Get the mineral

            const mineral = room.mineral

            if (mineral.mineralAmount === 0) {
                creep.advancedRecycle()
                continue
            }

            // If the creep needs resources

            if (creep.needsResources()) {
                // Harvest the mineral and iterate

                creep.advancedHarvestMineral(mineral)
                continue
            }

            // If there is a terminal

            if (room.terminal && room.terminal.store.getFreeCapacity() >= 10000) {
                // Transfer the creep's minerals to it

                creep.advancedTransfer(room.terminal, mineral.mineralType)
            }
        }
    }
}
