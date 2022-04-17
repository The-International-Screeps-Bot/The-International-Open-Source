import { constants } from "international/constants";
import { getRangeBetween } from "international/generalFunctions";
import { RemoteHarvester } from "room/creeps/creepClasses";

RemoteHarvester.prototype.travelToSource = function() {

    const creep = this,
    room = creep.room,

    // Define the creep's designated source

    sourceName = creep.memory.sourceName

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findSourceHarvestPos()) return false

    creep.say('🚬')

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRangeBetween(creep.pos.x, creep.pos.y, Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50)) == 0) return false

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: new RoomPosition(Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50), room.name), range: 0 },
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })

    return true
}
