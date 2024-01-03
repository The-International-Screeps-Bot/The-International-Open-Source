import {
    CombatRequestKeys,
    CreepMemoryKeys,
    Result,
    RoomTypes,
    customColors,
    roomDimensions,
    squadQuotas,
} from 'international/constants'
import { findClosestObject, getRangeXY, getRange, isExit, isXYExit, utils } from 'utils/utils'
import { Antifa } from './antifa'
import { CustomPathFinderArgs } from 'international/customPathFinder'

interface MembersByType {
  melee: Antifa
  healer: Antifa
  ranger: Antifa
  dismantler: Antifa
}

/**
 * A squad of a semi-dynamic size
 * Accepts at most 1 of each: antifaRangedAttacker, antifaAttacker, antifaHealer, antifaDismantler
 */
export class DynamicSquad {
  members: Antifa[] = []
  memberNames: string[] = []
  membersByType: MembersByType

  constructor(memberNames: string[]) {
    for (const memberName of memberNames) {
      const member = Game.creeps[memberName]
      this.members.push(member)
      this.memberNames.push(memberName)

      member.squad = this
      member.squadRan = true
    }

    const combatRequest =
      Memory.combatRequests[Memory.creeps[this.memberNames[0]][CreepMemoryKeys.combatRequest]]
    if (combatRequest) {
      combatRequest[CombatRequestKeys.dynamicSquads] += 1
    }
  }

  run() {
    this.membersByType = {
      melee: this.members[0],
      healer: this.members[0],
      ranger: this.members[0],
      dismantler: this.members[0],
    }



    if (!this.getInFormation()) return


  }

  private getInFormation() {
    const members = Object.values(this.membersByType) as Antifa[]
    /**
     * The last valid index
     */
    let previousIndex = 0

    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      if (!member) continue

      const previousMember = members[previousIndex]
      // If we are the member in question or nearby to it
      if (
        utils.getInterRange(
          member.pos,
          member.room.name,
          previousMember.pos,
          previousMember.room.name,
        ) <= 1
      ) {
        previousIndex = i
        continue
      }

      // This member is not in valid formation

      member.createMoveRequest({
        origin: member.pos,
        goals: [
          {
            pos: previousMember.pos,
            range: 1,
          },
        ],
      })
    }

    return true
  }

  /**
   * create a move request while in formation
   */
  private createMoveRequest() {}
}

