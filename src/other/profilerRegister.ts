import { CommuneManager } from 'room/commune/commune'
import { profiler } from './profiler'
import { RoomManager } from 'room/room'
import { SpawningStructuresManager } from 'room/commune/spawning/spawningStructures'
import { SpawnRequestsManager } from 'room/commune/spawning/spawnRequests'
import { TerminalManager } from 'room/commune/terminal/terminal'
import { LabManager } from 'room/commune/labs'
import { FactoryManager } from 'room/commune/factory'
import { StatsManager } from 'international/statsManager'
import { ConstructionManager } from 'room/construction/construction'
import { ObserverManager } from 'room/commune/observer'
import { RemotesManager } from 'room/commune/remotesManager'
import { HaulRequestManager } from 'room/commune/haulRequestManager'
import { SourceManager } from 'room/commune/sourceManager'
import { WorkRequestManager } from 'room/commune/workRequest'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { DynamicSquad } from 'room/creeps/roleManagers/antifa/dynamicSquad'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { originalLoop } from 'main'
import { creepClasses } from 'room/creeps/creepClasses'
import { Utils, outOfBucket } from 'utils/utils'
import { CreepOrganizer } from 'international/creepOrganizer'
import { RequestsManager } from 'international/requests'
import { SimpleAllies } from 'international/simpleAllies/simpleAllies'
import { PlayerManager } from 'international/players'
import { FlagManager } from 'international/flags'
import { RoomNameUtils } from 'room/roomNameUtils'
import { CreepUtils } from 'room/creeps/creepUtils'
import { SpawnUtils } from 'room/commune/spawning/spawnUtils'
import { MarketUtils } from 'room/commune/terminal/marketUtils'
import { CollectiveManager } from 'international/collective'
import { MarketManager } from 'international/market/marketOrders'
import { GarbageCollector } from 'international/garbageCollector'
import { EndTickManager } from 'international/endTick'
import { EndTickCreepManager } from 'room/creeps/endTickCreepManager'
import { PowerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ContainerManager } from 'room/container'
import { DroppedResourceManager } from 'room/droppedResources'
import { RuinsManager } from 'room/ruins'
import { TombstoneManager } from 'room/tombstones'
import { HaulerNeedManager } from 'room/commune/haulerNeed'
import { LinkManager } from 'room/commune/links'
import { StoringStructuresManager } from 'room/commune/storingStructures'
import { TowerManager } from 'room/commune/towers'
import { DefenceManager } from 'room/commune/defence'
import { PowerSpawnsManager } from 'room/commune/powerSpawn'
import { NukerManager } from 'room/commune/nuker'
import { CombatRequestManager } from 'room/commune/combatRequest'
import { HaulerSizeManager } from 'room/commune/haulerSize'
import { MapVisualsManager } from 'international/mapVisuals'
import { MigrationManager } from 'international/migration'
import { RoomPruningManager } from 'international/roomPruning'
import { RoomVisualsManager } from 'room/roomVisuals'
import { ErrorExporter } from './ErrorExporter'
import { RespawnManager } from 'international/respawn'
import { BasePlans } from 'room/construction/basePlans'
import { RampartPlans } from 'room/construction/rampartPlans'
import { Operator } from 'room/creeps/powerCreeps/operator'
import { minCutToExit } from 'room/construction/minCut'
import { FeatureFlagManager } from 'international/featureFlags'
import { ConstructionSiteManager } from 'international/constructionSiteManager'
import { TransactionsManager } from 'international/transactions'
import { CommunePlanner } from 'room/construction/communePlanner'
import { packBasePlanCoord, packCoord, packCoordList, packId, packIdList, packPos, packPosList, packRampartPlanCoord, packRoomName, packStampAnchors, packXYAsCoord, packXYAsPos, reversePosList, unpackBasePlanCoords, unpackCoord, unpackCoordAsPos, unpackCoordList, unpackCoordListAsPosList, unpackId, unpackIdList, unpackPos, unpackPosAt, unpackPosList, unpackRampartPlanCoord, unpackRoomName, unpackStampAnchors } from './codec'
import { CustomPathFinder } from 'international/customPathFinder'
import { RoomUtils } from 'room/roomUtils'
import { CommuneUtils } from 'room/commune/communeUtils'
import { RoomDataManager } from 'room/roomData'
import { CommuneDataManager } from 'room/commune/communeData'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'
import { CreepMoveUtils } from 'room/creeps/creepMoveUtils'

export function profilerRegister() {

    // Classes

    profiler.registerClass(CollectiveManager, 'CollectiveManager')
    profiler.registerClass(StatsManager, 'StatsManager')
    profiler.registerClass(PlayerManager, 'PlayerManager')
    profiler.registerClass(RequestsManager, 'RequestsManager')
    profiler.registerClass(CreepOrganizer, 'CreepOrganizer')
    profiler.registerClass(PowerCreepOrganizer, 'PowerCreepOrganizer')
    profiler.registerClass(SimpleAllies, 'SimpleAllies')
    profiler.registerClass(FlagManager, 'FlagManager')
    profiler.registerClass(FeatureFlagManager, 'FeatureFlagManager')
    profiler.registerClass(MarketManager, 'MarketOrdersManager')
    profiler.registerClass(ConstructionSiteManager, 'ConstructionSiteManager')
    profiler.registerClass(TransactionsManager, 'TransactionsManager')
    profiler.registerClass(GarbageCollector, 'GarbageCollector')
    profiler.registerClass(EndTickManager, 'EndTickManager')
    profiler.registerClass(MapVisualsManager, 'MapVisualsManager')
    profiler.registerClass(MigrationManager, 'MigrationManager')
    profiler.registerClass(RoomPruningManager, 'RoomPruningManager')
    profiler.registerClass(ErrorExporter, 'ErrorExporter')
    profiler.registerClass(RespawnManager, 'RespawnManager')
    profiler.registerClass(BasePlans, 'BasePlans')
    profiler.registerClass(RampartPlans, 'RampartPlans')
    profiler.registerClass(CustomPathFinder, 'CustomPathFinder')
    profiler.registerClass(MarketUtils, 'MarketUtils')
    profiler.registerClass(Utils, 'Utils')
    profiler.registerClass(CreepUtils, 'CreepUtils')
    profiler.registerClass(MyCreepUtils, 'MyCreepUtils')
    profiler.registerClass(CreepMoveUtils, 'CreepMoveUtils')

    // Room classes

    profiler.registerClass(CommuneManager, 'CommuneManager')
    profiler.registerClass(RoomManager, 'RoomManager')
    profiler.registerClass(SpawningStructuresManager, 'SpawningStructuresManager')
    profiler.registerClass(SpawnRequestsManager, 'SpawnRequestsManager')
    profiler.registerClass(TerminalManager, 'TerminalManager')
    profiler.registerClass(LabManager, 'LabManager')
    profiler.registerClass(FactoryManager, 'FactoryManager')
    profiler.registerClass(CommunePlanner, 'CommunePlanner')
    profiler.registerClass(ConstructionManager, 'ConstructionManager')
    profiler.registerClass(ObserverManager, 'ObserverManager')
    profiler.registerClass(RemotesManager, 'RemotesManager')
    profiler.registerClass(HaulRequestManager, 'HaulRequestManager')
    profiler.registerClass(SourceManager, 'SourceManager')
    profiler.registerClass(WorkRequestManager, 'WorkRequestManager')
    profiler.registerClass(Quad, 'Quad')
    profiler.registerClass(DynamicSquad, 'DynamicSquad')
    profiler.registerClass(Duo, 'Duo')
    profiler.registerClass(EndTickCreepManager, 'EndTickCreepManager')
    profiler.registerClass(ContainerManager, 'ContainerManager')
    profiler.registerClass(DroppedResourceManager, 'DroppedResourceManager')
    profiler.registerClass(RuinsManager, 'RuinManager')
    profiler.registerClass(TombstoneManager, 'TombstoneManager')
    profiler.registerClass(HaulerNeedManager, 'HaulerNeedManager')
    profiler.registerClass(LinkManager, 'LinkManager')
    profiler.registerClass(StoringStructuresManager, 'StoringStructuresManager')
    profiler.registerClass(TowerManager, 'TowerManager')
    profiler.registerClass(DefenceManager, 'DefenceManager')
    profiler.registerClass(PowerSpawnsManager, 'PowerSpawnsManager')
    profiler.registerClass(NukerManager, 'NukerManager')
    profiler.registerClass(CombatRequestManager, 'CombatRequestManager')
    profiler.registerClass(HaulerSizeManager, 'HaulerSize')
    profiler.registerClass(RoomVisualsManager, 'RoomVisualsManager')
    profiler.registerClass(Operator, 'Operator')
    profiler.registerClass(RoomNameUtils, 'RoomNameUtils')
    profiler.registerClass(SpawnUtils, 'SpawnUtils')
    profiler.registerClass(RoomUtils, 'RoomUtils')
    profiler.registerClass(CommuneUtils, 'CommuneUtils')
    profiler.registerClass(RoomDataManager, 'RoomDataManager')
    profiler.registerClass(CommuneDataManager, 'CommuneDataManager')

    // Objects

    profiler.registerObject(global.debugUtils, 'debugUtils')

    // Room objects



    // Functions

    profiler.registerFN(originalLoop, 'loop')
    profiler.registerFN(outOfBucket, 'outOfBucket')

    // codec functions

    profiler.registerFN(packId, 'packId')
    profiler.registerFN(unpackId, 'unpackId')
    profiler.registerFN(packIdList, 'packIdList')
    profiler.registerFN(unpackIdList, 'unpackIdList')
    profiler.registerFN(packCoord, 'packCoord')
    profiler.registerFN(packXYAsCoord, 'packXYAsCoord')
    profiler.registerFN(unpackCoord, 'unpackCoord')
    profiler.registerFN(unpackCoordAsPos, 'unpackCoordAsPos')
    profiler.registerFN(reversePosList, 'reversePosList')
    profiler.registerFN(packCoordList, 'packCoordList')
    profiler.registerFN(unpackCoordList, 'unpackCoordList')
    profiler.registerFN(unpackCoordListAsPosList, 'unpackCoordListAsPosList')
    profiler.registerFN(packRoomName, 'packRoomName')
    profiler.registerFN(unpackRoomName, 'unpackRoomName')
    profiler.registerFN(packPos, 'packPos')
    profiler.registerFN(packXYAsPos, 'packXYAsPos')
    profiler.registerFN(unpackPos, 'unpackPos')
    profiler.registerFN(packPosList, 'packPosList')
    profiler.registerFN(unpackPosList, 'unpackPosList')
    profiler.registerFN(unpackPosAt, 'unpackPosAt')
    profiler.registerFN(packBasePlanCoord, 'packBasePlanCoord')
    profiler.registerFN(unpackBasePlanCoords, 'unpackBasePlanCoords')
    profiler.registerFN(packRampartPlanCoord, 'packRampartPlanCoord')
    profiler.registerFN(unpackRampartPlanCoord, 'unpackRampartPlanCoord')
    profiler.registerFN(packStampAnchors, 'packStampAnchors')
    profiler.registerFN(unpackStampAnchors, 'unpackStampAnchors')

    // Room functions

    profiler.registerFN(minCutToExit, 'minCutToExit')

    // conditional or complicated

    if (global.userScript) profiler.registerFN(global.userScript, 'userScript')
    if (global.collectivizer) profiler.registerClass(global.collectivizer, 'collectivizer')

    for (const creepClass of new Set(Object.values(creepClasses))) {
        profiler.registerClass(creepClass, creepClass.toString().match(/ (\w+)/)[1])
    }
}
