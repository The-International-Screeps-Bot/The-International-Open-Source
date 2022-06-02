import { customLog } from 'international/generalFunctions'
import { Scout } from 'room/creeps/creepClasses'

Scout.prototype.preTickManager = function () {
     if (!this.memory.scoutTarget) return

     const commune = Game.rooms[this.memory.communeName]
     if (!commune) return

     commune.scoutTargets.add(this.memory.scoutTarget)
}
