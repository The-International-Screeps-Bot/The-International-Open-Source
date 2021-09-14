Creep.prototype.buildSites = function() {

    let creep = this
    let room = creep.room



}

Creep.prototype.repairStructures = function() {

    let creep = this
    let room = creep.room



}

Creep.prototype.wait = function() {

    let creep = this
    let room = creep.room

    if (waitAwayFromAnchorPoint()) return true

    function waitAwayFromAnchorPoint() {

        if (creep.pos.getRangeTo(anchorPoint) == 6) return true

        if (creep.pos.getRangeTo(anchorPoint) > 6) {

            creep.travel({
                origin: creep.pos,
                goal: { pos: anchorPoint, range: 6 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })

            return true
        }

        creep.travel({
            origin: creep.pos,
            goal: { pos: anchorPoint, range: 6 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: true,
            cacheAmount: 10,
        })

        return true
    }
}