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
creepClasses.source1Harvester = SourceHarvester
creepClasses.source2Harvester = SourceHarvester

export class Hauler extends Creep {
    reserve?(): void

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
    getEnergy?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.builder = Builder

export class Maintainer extends Creep {
    advancedMaintain?(): boolean

    maintainNearby?(): boolean

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

    /**
     * @returns If a reservation was made or not
     */
     reserve?(): void

    /**
     * @returns If a reservation was made or not
     */
    reserveStorageTransfer?(): boolean

    /**
     * @returns If a reservation was made or not
     */
    reserveTerminalTransfer?(): boolean

    /**
     * @returns If a reservation was made or not
     */
    reserverHubLinkTransfer?(): boolean

    /**
     * @returns If a reservation was made or not
     */
    reserveFactoryWithdraw?(): boolean

    /**
     * @returns If a reservation was made or not
     */
    reserveFactoryTransfer?(): boolean
/*
    balanceStoringStructures?(): boolean

    fillHubLink?(): boolean
 */
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
    travelToSource?(sourceIndex: number): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.source1RemoteHarvester = RemoteHarvester
creepClasses.source2RemoteHarvester = RemoteHarvester

export class RemoteHauler extends Creep {
    /**
     * Finds a remote to haul from
     */
    findRemote?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.remoteHauler = RemoteHauler

export class RemoteReserver extends Creep {
    /**
     * Finds a remote to reserve
     */
    findRemote?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.remoteReserver = RemoteReserver

export class RemoteDefender extends Creep {
    /**
     * Finds a remote to defend
     */
    findRemote?(): boolean

    /**
     * Find and attack enemyCreeps
     */
    advancedAttackEnemies?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.remoteDefender = RemoteDefender

export class RemoteCoreAttacker extends Creep {
    /**
     * Finds a remote
     */
    findRemote?(): boolean

    /**
     * Find and attack cores
     */
    advancedAttackCores?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.remoteCoreAttacker = RemoteCoreAttacker

export class RemoteDismantler extends Creep {
    /**
     * Finds a remote
     */
    findRemote?(): boolean

    /**
     * Find and attack structures
     */
    advancedDismantle?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.remoteDismantler = RemoteDismantler

export class Scout extends Creep {
    /**
     * Finds a room name for the scout to target
     */
    findScoutTarget?(): boolean

    recordDeposits?(): void

    /**
     * Tries to sign a room's controller depending on the situation
     */
    advancedSignController?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.scout = Scout

export class Claimer extends Creep {
    /**
     * Claims a room specified in the creep's commune claimRequest
     */
    claimRoom?(): void

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.claimer = Claimer

export class Vanguard extends Creep {
    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean

    /**
     * Builds a spawn in the creep's commune claimRequest
     */
    buildRoom?(): void

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.vanguard = Vanguard

export class AllyVanguard extends Creep {
    findRemote?(): boolean

    getEnergyFromRemote?(): void

    getEnergyFromRoom?(): boolean

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean

    /**
     * Builds a spawn in the creep's commune claimRequest
     */
    buildRoom?(): void

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.allyVanguard = AllyVanguard

export class VanguardDefender extends Creep {
    /**
     * Find and attack enemyCreeps
     */
    advancedAttackEnemies?(): boolean

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.vanguardDefender = VanguardDefender

export class AntifaAssaulter extends Creep {
    /**
     * Tries to find a squad, creating one if none could be found
     */
    findSquad?(): boolean

    runSingle?(): void

    advancedRangedAttack?(): void

    advancedAttack?(): void

    advancedDismantle?(): void

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.antifaAssaulter = AntifaAssaulter

export class AntifaSupporter extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }
}
creepClasses.antifaSupporter = AntifaSupporter

export { creepClasses }
