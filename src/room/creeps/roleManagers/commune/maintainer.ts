import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    roomDimensions,
} from 'international/constants'
import { statsManager } from 'international/statsManager'
import { findCoordsInsideRect, findObjectWithID, getRange } from 'utils/utils'
import { packCoord } from 'other/codec'
import { creepUtils } from 'room/creeps/creepUtils'

export class Maintainer extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    update() {
        const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
        if (packedCoord) {
            this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.normal)
        }
    }

    initRun() {
        this.avoidEnemyThreatCoords()
    }

    run?() {
        const cSiteTarget = this.room.roomManager.cSiteTarget
        if (cSiteTarget && cSiteTarget.structureType === STRUCTURE_SPAWN) {
            this.advancedBuild()

            return
        }
        /*
        const rampartCSite = this.room.find(FIND_MY_CONSTRUCTION_SITES).find(site => site.structureType === STRUCTURE_RAMPART)
        if (rampartCSite && this.advancedBuildCSite(rampartCSite) !== Result.fail) return
        */
        if (creepUtils.repairCommune(this)) return
        if (creepUtils.repairNearby(this)) return
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Maintainer = Game.creeps[creepName]
            creep.run()
        }
    }
}
