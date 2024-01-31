import { CombatRequestKeys, CreepMemoryKeys } from '../../../../constants/general'
import { findClosestObject, getRange, Utils } from 'utils/utils'
import { Antifa } from './antifa'

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

    if (this.runCombatRoom()) return

    if (!this.getInFormation()) return
  }

  private runCombatRoom() {
    this.runMelee()
    this.runHealer()
    this.runRanger()
    this.runDismantler()
    return true
  }

  private runMelee() {
    const melee = this.membersByType.melee
    if (!melee) return
  }

  private runHealer() {
    const healer = this.membersByType.healer
    if (!healer) return

    const melee = this.membersByType.melee
    if (melee) {
      if (getRange(healer.pos, melee.pos) <= 1) {
        if (melee.hits < melee.hitsMax) {
          healer.heal(melee)
          healer.assignMoveRequest(melee.pos)
        }
        return

        healer.createMoveRequest({
          origin: healer.pos,
          goals: [
            {
              pos: melee.pos,
              range: 1,
            },
          ],
        })
      }
      return
    }

    // There is no melee

    healer.say('no M')
  }

  private runRanger() {
    const ranger = this.membersByType.ranger
    if (!ranger) return
  }

  private runDismantler() {
    const dismantler = this.membersByType.dismantler
    if (!dismantler) return
    /*
    const structure = findClosestObject(dismantler.pos, dismantler.room.roomManager.combatStructureTargets)
    if (!structure) return */

    dismantler.advancedDismantle()
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
        Utils.getInterRange(
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
