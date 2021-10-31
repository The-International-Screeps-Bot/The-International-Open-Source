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

const creepClasses = {
    'sourceHarvester': SourceHarvester,
}

export { SourceHarvester }
