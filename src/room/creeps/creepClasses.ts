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

export { RoleSourceHarvester, RoleHauler }

export const creepClasses: {[key: string]: any} = {
    'sourceHarvester': SourceHarvester,
    'hauler': Hauler,
}
