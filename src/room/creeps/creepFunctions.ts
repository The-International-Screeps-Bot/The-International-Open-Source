Creep.prototype.travel = function(opts: {[key: string]: any}): any {

    const creep = this


}

Creep.prototype.isDying = function() {

    const creep = this

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // Stop if creep body parts * 3 is more or less than ticks left alive

    if (creep.ticksToLive > creep.body.length * 3) return false

    // Record creep as dying

    creep.memory.dying = true
    return true
}
