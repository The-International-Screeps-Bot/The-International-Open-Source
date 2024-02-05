import { Result, RoomLogisticsRequestTypes } from '../../../../constants/general'
import { LogOps } from 'utils/logOps'
import { findObjectWithID, getRange } from 'utils/utils'

export class Builder extends Creep {
  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  initRun() {
    if (this.avoidEnemyThreatCoords()) return

    if (!this.room.roomManager.cSiteTarget) return
    if (!this.room.communeManager.buildersMakeRequests) return
    if (this.usedReserveStore > this.store.getCapacity() * 0.5) return

    this.room.roomManager.room.createRoomLogisticsRequest({
      target: this,
      type: RoomLogisticsRequestTypes.transfer,
      priority: 100,
    })
  }

  run?() {
    if (this.advancedBuild() === Result.fail) this.advancedRecycle()
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
      const creep: Builder = Game.creeps[creepName]
      creep.run()
    }
  }
}
