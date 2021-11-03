interface SourceHarvesterMemory extends CreepMemory {

}

interface SourceHarvester extends Creep {
    [key: string]: any
}

class SourceHarvester extends Creep {
    constructor(creep: Creep) {

        super(creep.id)

    }
}

export const creepClasses: {[key: string]: any} = {
    'sourceHarvester': SourceHarvester,
}
