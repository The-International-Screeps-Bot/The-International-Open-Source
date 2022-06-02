import { RemoteReserver } from 'room/creeps/creepClasses'

RemoteReserver.prototype.isDying = function () {
     // Inform as dying if creep is already recorded as dying

     if (this.memory.dying) return true

     // Stop if creep is spawning

     if (!this.ticksToLive) return false

     // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

     if (this.ticksToLive > this.body.length * CREEP_CLAIM_LIFE_TIME) return false

     // Record creep as dying

     this.memory.dying = true
     return true
}
