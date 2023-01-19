import { customLog, findClosestObject, getRange } from 'international/utils'

export class Hauler extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static haulerManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Hauler = Game.creeps[creepName]

            creep.passiveRenew()
            creep.runRoomLogisticsRequestsAdvanced()

            customLog('HAULER RUN', creep.name)

            /* creep.room.visual.text((creep.nextStore.energy).toString(), creep.pos) */

            /*
            creep.haul()
             */
        }
    }
}
