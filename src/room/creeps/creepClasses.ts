import { Antifa } from './roleManagers/antifa/antifa'
import { Builder } from './roleManagers/commune/builder'
import { ControllerUpgrader } from './roleManagers/commune/controllerUpgrader'
import { FastFiller } from './roleManagers/commune/fastFiller'
import { Hauler } from './roleManagers/commune/hauler'
import { HubHauler } from './roleManagers/commune/hubHauler'
import { Maintainer } from './roleManagers/commune/maintainer'
import { MeleeDefender } from './roleManagers/commune/defenders/meleeDefender'
import { MineralHarvester } from './roleManagers/commune/mineralHarvester'
import { SourceHarvester } from './roleManagers/commune/sourceHarvester'
import { AllyVanguard } from './roleManagers/international/allyVanguard'
import { Claimer } from './roleManagers/international/claimer'
import { Scout } from './roleManagers/international/scout'
import { Vanguard } from './roleManagers/international/vanguard'
import { RemoteCoreAttacker } from './roleManagers/remote/remoteCoreAttacker'
import { RemoteDefender } from './roleManagers/remote/remoteDefender'
import { RemoteDismantler } from './roleManagers/remote/remoteDismantler'
import { RemoteHarvester } from './roleManagers/remote/remoteSourceHarvester'
import { RemoteHauler } from './roleManagers/remote/remoteHauler'
import { RemoteReserver } from './roleManagers/remote/remoteReserver'
import { RequestHauler } from './roleManagers/international/requestHauler'
import { RangedDefender } from './roleManagers/commune/defenders/rangedDefender'
import { profiler } from 'other/profiler'

export const creepClasses: { [key in CreepRoles]: any } = {
    sourceHarvester: SourceHarvester,
    hauler: Hauler,
    requestHauler: RequestHauler,
    controllerUpgrader: ControllerUpgrader,
    builder: Builder,
    maintainer: Maintainer,
    mineralHarvester: MineralHarvester,
    hubHauler: HubHauler,
    fastFiller: FastFiller,
    meleeDefender: MeleeDefender,
    rangedDefender: RangedDefender,
    remoteSourceHarvester: RemoteHarvester,
    remoteHauler: RemoteHauler,
    remoteReserver: RemoteReserver,
    remoteDefender: RemoteDefender,
    remoteCoreAttacker: RemoteCoreAttacker,
    remoteDismantler: RemoteDismantler,
    scout: Scout,
    claimer: Claimer,
    vanguard: Vanguard,
    allyVanguard: AllyVanguard,
    antifaRangedAttacker: Antifa,
    antifaAttacker: Antifa,
    antifaHealer: Antifa,
    antifaDismantler: Antifa,
    antifaDowngrader: Antifa,
}
/*
export const newCreepClasses: { [key in CreepRoles]: any } = {
    hauler: HaulerManager,
}
 */
