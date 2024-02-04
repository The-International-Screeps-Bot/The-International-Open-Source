import { WorkRequestKeys, CreepMemoryKeys, Result, RoomTypes, tauntSign } from '../../../../constants/general'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'

export class Claimer extends Creep {
  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  initRun() {
    if (this.isDying()) return

    const request = Memory.workRequests[this.memory[CreepMemoryKeys.workRequest]]
    if (!request) return

    request[WorkRequestKeys.claimer] -= 1
  }

  findSwampCost?() {
    const moveParts = MyCreepUtils.parts(this)
    if (moveParts.move >= 5) return 1

    return undefined
  }

  /**
   * Claims a room specified in the creep's commune workRequest
   */
  claimRoom?(): void {
    const creep = this
    const { room } = creep

    if (room.controller.my) return

    // If the creep is not in range to claim the controller

    if (creep.pos.getRangeTo(room.controller) > 1) {
      // Move to the controller and stop

      creep.createMoveRequest({
        origin: creep.pos,
        goals: [{ pos: room.controller.pos, range: 1 }],
        avoidEnemyRanges: true,
        plainCost: 1,
        swampCost: this.findSwampCost(),
      })

      return
    }

    // If the owner or reserver isn't me

    if (
      room.controller.owner ||
      (room.controller.reservation && room.controller.reservation.username !== Memory.me)
    ) {
      creep.attackController(room.controller)
      return
    }

    // Otherwise, claim the controller. If the successful, remove claimerNeed

    if (!creep.claimController(room.controller)) return

    // We claimed the controller

    creep.signController(room.controller, tauntSign)
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
      // Get the creep using its name

      const creep: Claimer = Game.creeps[creepName]

      creep.message = creep.memory[CreepMemoryKeys.workRequest]

      if (room.name === creep.memory[CreepMemoryKeys.workRequest]) {
        creep.claimRoom()
        continue
      }

      // Otherwise if the creep is not in the claimTarget

      if (
        creep.createMoveRequest({
          origin: creep.pos,
          goals: [
            {
              pos: new RoomPosition(25, 25, creep.memory[CreepMemoryKeys.workRequest]),
              range: 25,
            },
          ],
          avoidEnemyRanges: true,
          plainCost: 1,
          swampCost: MyCreepUtils.parts(creep).move >= 5 ? 1 : undefined,
          typeWeights: {
            [RoomTypes.enemy]: Infinity,
            [RoomTypes.ally]: Infinity,
            [RoomTypes.sourceKeeper]: Infinity,
          },
        }) === Result.fail
      ) {
        const request = Memory.workRequests[creep.memory[CreepMemoryKeys.workRequest]]
        if (request) request[WorkRequestKeys.abandon] = 20000
      }
    }
  }
}
