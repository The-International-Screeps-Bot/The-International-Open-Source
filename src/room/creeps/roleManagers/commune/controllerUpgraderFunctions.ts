import { ControllerUpgrader } from '../../creepClasses'

ControllerUpgrader.prototype.isDying = function () {
    // Inform as dying if creep is already recorded as dying

    if (this.memory.dying) return true

    // Stop if creep is spawning

    if (!this.ticksToLive) return false

    // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

    if (
        this.ticksToLive >
        this.body.length * CREEP_SPAWN_TIME +
            (this.room.global.upgradePathLength || 0)
    )
        return false

    // Record creep as dying

    this.memory.dying = true
    return true
}
