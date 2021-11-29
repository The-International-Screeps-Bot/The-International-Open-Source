/* interface SourceHarvesterMemory extends CreepMemory {

} */

interface RoleSourceHarvester extends Creep {
    [key: string]: any
}

class SourceHarvester extends Creep {
    constructor(creep: Creep) {

        super(creep.id)

    }
}

interface RoleHauler extends Creep {
    [key: string]: any
}

class Hauler extends Creep {
    constructor(creep: Creep) {

        super(creep.id)

    }
}

interface RoleMineralHarvester extends Creep {
    [key: string]: any
}

class MineralHarvester extends Creep {
    constructor(creep: Creep) {

        super(creep.id)

    }
}

interface RoleAntifaAssaulter extends Creep {
    [key: string]: any
}


class AntifaAssaulter {
    constructor() {


    }
}

interface RoleAntifaSupporter extends Creep {
    [key: string]: any
}


class AntifaSupporter {
    constructor() {


    }
}
