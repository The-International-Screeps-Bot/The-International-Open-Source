import { internationalManager } from 'international/international'

export class RequestHauler extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (Memory.haulRequests[this.memory.HRN]) {
            internationalManager.creepsByHaulRequest[this.memory.HRN].push(this.name)
        }
    }

    static requestHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RequestHauler = Game.creeps[creepName]
        }
    }
}
