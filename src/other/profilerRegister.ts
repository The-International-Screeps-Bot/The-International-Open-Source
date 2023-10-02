import { CommuneManager } from 'room/commune/commune'
import { profiler } from './profiler'
import { RoomManager } from 'room/room'
import { SpawningStructuresManager } from 'room/commune/spawning/spawningStructures'
import { SpawnRequestsManager } from 'room/commune/spawning/spawnRequests'
import { TerminalManager } from 'room/commune/terminal/terminal'
import { LabManager } from 'room/commune/labs'
import { FactoryManager } from 'room/commune/factory'
import { StatsManager, statsManager } from 'international/statsManager'
import { CommunePlanner } from 'room/communePlanner'
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
import { outOfBucket } from 'utils/utils'
import { creepOrganizer } from 'international/creepOrganizer'
import { requestsManager } from 'international/requests'
import { simpleAllies } from 'international/simpleAllies'
import { PlayerManager } from 'international/players'
import { customFindPath } from 'international/customPathFinder'
import { flagManager } from 'international/flags'

// Classes

profiler.registerClass(CommuneManager, 'CommuneManager')
profiler.registerClass(RoomManager, 'RoomManager')
profiler.registerClass(SpawningStructuresManager, 'SpawningStructuresManager')
profiler.registerClass(SpawnRequestsManager, 'SpawnRequestsManager')
profiler.registerClass(TerminalManager, 'TerminalManager')
profiler.registerClass(LabManager, 'LabManager')
profiler.registerClass(FactoryManager, 'FactoryManager')
profiler.registerClass(StatsManager, 'StatsManager')
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
profiler.registerClass(PlayerManager, 'PlayerManager')

// Objects

profiler.registerObject(creepOrganizer, 'creepOrganizer')
profiler.registerObject(requestsManager, 'requestsManager')
profiler.registerObject(simpleAllies, 'simpleAllies')
profiler.registerFN(flagManager, 'flagManager')

// Functions

profiler.registerFN(originalLoop, 'loop')
profiler.registerFN(customFindPath, 'customFindPath')
profiler.registerFN(outOfBucket, 'outOfBucket')

// conditional or complicated

if (global.userScript) profiler.registerFN(global.userScript, 'userScript')
if (global.collectivizer) profiler.registerClass(global.collectivizer, 'collectivizer')

for (const creepClass of new Set(Object.values(creepClasses))) {
    profiler.registerClass(creepClass, creepClass.toString().match(/ (\w+)/)[1])
}
