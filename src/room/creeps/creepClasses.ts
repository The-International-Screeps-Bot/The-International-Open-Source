import { AntifaAssaulter } from './roleManagers/antifa/antifaAssaulter'
import { Builder } from './roleManagers/commune/builder'
import { ControllerUpgrader } from './roleManagers/commune/controllerUpgrader'
import { FastFiller } from './roleManagers/commune/fastFiller'
import { Hauler } from './roleManagers/commune/hauler'
import { HubHauler } from './roleManagers/commune/hubHaulerManager'
import { Maintainer } from './roleManagers/commune/maintainer'
import { MeleeDefender } from './roleManagers/commune/meleeDefender'
import { MineralHarvester } from './roleManagers/commune/mineralHarvester'
import { SourceHarvester } from './roleManagers/commune/sourceHarvester'
import { AllyVanguard } from './roleManagers/international/allyVanguard'
import { Claimer } from './roleManagers/international/claimer'
import { Scout } from './roleManagers/international/scout'
import { Vanguard } from './roleManagers/international/vanguard'
import { VanguardDefender } from './roleManagers/international/vanguardDefender'
import { RemoteCoreAttacker } from './roleManagers/remote/remoteCoreAttacker'
import { RemoteDefender } from './roleManagers/remote/remoteDefender'
import { RemoteDismantler } from './roleManagers/remote/remoteDismantler'
import { RemoteHarvester } from './roleManagers/remote/remoteHarvesterFunctions'
import { RemoteHauler } from './roleManagers/remote/remoteHauler'
import { RemoteReserver } from './roleManagers/remote/remoteReserver'

const creepClasses: Partial<Record<CreepRoles, any>> = {}

creepClasses.source1Harvester = SourceHarvester
creepClasses.source2Harvester = SourceHarvester
creepClasses.hauler = Hauler
creepClasses.controllerUpgrader = ControllerUpgrader
creepClasses.builder = Builder
creepClasses.maintainer = Maintainer
creepClasses.mineralHarvester = MineralHarvester
creepClasses.hubHauler = HubHauler
creepClasses.fastFiller = FastFiller
creepClasses.meleeDefender = MeleeDefender
creepClasses.source1RemoteHarvester = RemoteHarvester
creepClasses.source2RemoteHarvester = RemoteHarvester
creepClasses.remoteHauler = RemoteHauler
creepClasses.remoteReserver = RemoteReserver
creepClasses.remoteDefender = RemoteDefender
creepClasses.remoteCoreAttacker = RemoteCoreAttacker
creepClasses.remoteDismantler = RemoteDismantler
creepClasses.scout = Scout
creepClasses.claimer = Claimer
creepClasses.vanguard = Vanguard
creepClasses.allyVanguard = AllyVanguard
creepClasses.vanguardDefender = VanguardDefender
creepClasses.antifaAssaulter = AntifaAssaulter

export { creepClasses }
