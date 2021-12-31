interface CreepClasses {
    [key: string]: any
}

const creepClasses: CreepClasses = {}

export class SourceHarvester extends Creep {
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

export class MineralHarvester extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.mineralHarvester = MineralHarvester

export class Antifa extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.antifa = Antifa

export { creepClasses }
