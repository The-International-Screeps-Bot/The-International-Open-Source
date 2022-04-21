const creepClasses: Partial<Record<CreepRoles, any>> = {}

export class SourceHarvester extends Creep {

    travelToSource?(): boolean

    transferToSourceExtensions?(): boolean

    transferToSourceLink?(): boolean

    repairSourceContainer?(sourceContainer: StructureContainer): boolean

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

    advancedMaintain?(): boolean

    maintainAtFeet?(): boolean

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

export class HubHauler extends Creep {

    travelToHub?(): boolean

    balanceStoringStructures?(): boolean

    fillHubLink?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.hubHauler = HubHauler

export class FastFiller extends Creep {

    travelToFastFiller?(): boolean

    fillFastFiller?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.fastFiller = FastFiller

export class MeleeDefender extends Creep {

    advancedDefend?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.meleeDefender = MeleeDefender

export class RemoteHarvester extends Creep {

    /**
     * Finds a remote to harvest in
     */
    findRemote?(): boolean

    /**
     *
     */
    travelToSource?(sourceName: ('source1' | 'source2')): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.source1RemoteHarvester = RemoteHarvester
creepClasses.source2RemoteHarvester = RemoteHarvester

export class RemoteHauler extends Creep {

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.remoteHauler = RemoteHauler

export class Reserver extends Creep {

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.remoteReserver = Reserver

export class RemoteDefender extends Creep {

    /**
     * Finds a remote to defend
     */
    findRemote?(): boolean

    advancedHeal?(): void

    /**
     * Find and attack enemyAttackers
     */
    advancedAttackAttackers?(): boolean

    constructor(creepID: Id<Creep>) {

        super(creepID)

    }
}
creepClasses.remoteDefender = RemoteDefender

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
