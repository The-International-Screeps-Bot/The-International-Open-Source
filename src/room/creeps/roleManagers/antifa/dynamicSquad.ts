import {
    CombatRequestKeys,
    CreepMemoryKeys,
    Result,
    RoomTypes,
    customColors,
    roomDimensions,
    squadQuotas,
} from 'international/constants'
import { findClosestObject, getRangeXY, getRange, isExit, isXYExit } from 'utils/utils'
import { Antifa } from './antifa'
import { CustomPathFinderArgs } from 'international/customPathFinder'

/**
 * A squad of a semi-dynamic size
 * Accepts at most 1 of each: antifaRangedAttacker, antifaAttacker, antifaHealer, antifaDismantler
 */
export class DynamicSquad {
    members: Antifa[] = []
    memberNames: string[] = []

    constructor(memberNames: string[]) {
        for (const memberName of memberNames) {
            const member = Game.creeps[memberName]
            this.members.push(member)
            this.memberNames.push(memberName)

            member.squad = this
            member.squadRan = true
        }

        const combatRequest = Memory.combatRequests[Memory.creeps[this.memberNames[0]][CreepMemoryKeys.combatRequest]]
        if (combatRequest) {

            combatRequest[CombatRequestKeys.dynamicSquads] += 1
        }
    }

    run() {

        
    }
}
