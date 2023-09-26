import { CreepMemoryKeys } from 'international/constants'
import { customLog } from 'utils/logging'
import { findClosestObject, getRange } from 'utils/utils'

export class Hauler extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    run?() {
        /*
        const creepMemory = Memory.creeps[this.name]

        if (!creepMemory[CreepMemoryKeys.roomLogisticsRequests].length && this.needsResources()) {


        }
 */
        this.passiveRenew()
        this.runRoomLogisticsRequestsAdvanced()

        /* log('HAULER RUN', this.name) */
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Hauler = Game.creeps[creepName]
            creep.run()
        }
    }
}
