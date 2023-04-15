import { CreepMemoryKeys } from 'international/constants'
import { internationalManager } from 'international/international'

export class RequestHauler extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (Memory.haulRequests[this.memory[CreepMemoryKeys.haulRequest]]) {
            internationalManager.creepsByHaulRequest[this.memory[CreepMemoryKeys.haulRequest]].push(this.name)
        }
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RequestHauler = Game.creeps[creepName]
        }
    }
}
