interface CreepClasses {
    [key: string]: any
}

const creepClasses: CreepClasses = {}

export class SourceHarvester extends Creep {

    repairSourceContainer?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.sourceHarvester = SourceHarvester

export class Hauler extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.hauler = Hauler

export class ControllerUpgrader extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.controllerUpgrader = ControllerUpgrader

export class Builder extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.builder = Builder

export class Maintainer extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.maintainer = Maintainer

export class MineralHarvester extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.mineralHarvester = MineralHarvester

export class Scout extends Creep {

    /**
     * Finds a room name for the scout to target
     */
    findScoutTarget?(): void

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.maintainer = Scout

export class Antifa extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.antifa = Antifa

export { creepClasses }
