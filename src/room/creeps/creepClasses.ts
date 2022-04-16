interface CreepClasses {
    [key: string]: any
}

const creepClasses: CreepClasses = {}

export class SourceHarvester extends Creep {

    travelToSource?(): boolean
    transferToSourceLink?(): void
    createWithdrawTask?(sourceContainer: StructureContainer): void
    repairSourceContainer?(sourceContainer: StructureContainer): void

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

    advancedHarvestMineral?(mineral: Mineral): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.mineralHarvester = MineralHarvester

export class MeleeDefender extends Creep {

    advancedDefend?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.meleeDefender = MeleeDefender

export class RemoteHarvester extends Creep {

    /**
     *
     */
     travelToSource?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.remoteHarvester = RemoteHarvester

export class RemoteHauler extends Creep {

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.remoteHauler = RemoteHauler

export class Scout extends Creep {

    /**
     * Finds a room name for the scout to target
     */
    findScoutTarget?(): void

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.scout = Scout

export class Claimer extends Creep {

    /**
     * Claims a room specified in the creep's memory
     */
    claimRoom?(): void

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.claimer = Claimer

export class Antifa extends Creep {
    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.antifa = Antifa

export { creepClasses }
