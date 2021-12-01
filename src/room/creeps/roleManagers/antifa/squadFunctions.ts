interface Members {
    assaulter1: Creep
    assaulter2: Creep
    supporter1: Creep
    supporter2: Creep
}

interface Squad extends Members {
    [key: string]: any
}

class Squad {
    constructor(members: Members[]) {

        // Assign members to squad

        for (const creepName in members) {

            this[creepName] = members[creepName]
        }
    }
}

Squad.prototype.enterAttackMode = function() {

    const squad: Squad = this


}
