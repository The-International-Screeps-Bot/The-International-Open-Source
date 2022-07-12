// Imports

// International

import './international/commands'
import { internationalManager } from './international/internationalManager'
import './international/config'
import './international/tickConfig'
import './international/creepOrganizer'
import './room/remotesManager'
import './international/constructionSiteManager'
import './international/mapVisualsManager'
import './international/endTickManager'

// Room

import './room/remotesManager'
import { roomManager } from 'room/roomManager'
import './room/roomAdditions'

import './room/resourceAdditions'
import './room/roomObjectFunctions'

// Creep

import './room/creeps/creepAdditions'

// Other

import { memHack } from 'other/memHack'
import { RoomCacheObject } from 'room/roomObject'
import { ErrorMapper } from 'other/ErrorMapper'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { createPackedPosMap, customLog } from 'international/generalFunctions'

// Type declareations for global

declare global {
     interface Pos {
          x: number
          y: number
     }

     export interface Coord {
          x: number
          y: number
     }

     interface Rect {
          x1: number
          y1: number
          x2: number
          y2: number
     }

     interface Colors {
          white: string
          lightGrey: string
          lightBlue: string
          darkBlue: string
          black: string
          yellow: string
          red: string
          green: string
          brown: string
     }

     type RemoteStampTypes = 'road' | 'container'

     type StampTypes =
          | 'fastFiller'
          | 'hub'
          | 'extensions'
          | 'labs'
          | 'tower'
          | 'extension'
          | 'observer'
          | 'sourceLink'
          | 'sourceExtension'
          | 'container'
          | 'extractor'
          | 'road'
          | 'rampart'

     interface Stamp {
          offset: number

          /**
           * The range of protection from the anchor to provide when deciding rampart placement
           */
          protectionOffset: number
          size: number
          structures: { [structureType: string]: Pos[] }
     }

     type StampAnchors = Partial<Record<StampTypes, RoomPosition[]>>

     type PackedPosMap = any[]

     type CreepRoles =
          | 'source1Harvester'
          | 'source2Harvester'
          | 'hauler'
          | 'controllerUpgrader'
          | 'builder'
          | 'maintainer'
          | 'mineralHarvester'
          | 'hubHauler'
          | 'fastFiller'
          | 'meleeDefender'
          | 'source1RemoteHarvester'
          | 'source2RemoteHarvester'
          | 'remoteHauler'
          | 'remoteReserver'
          | 'remoteDefender'
          | 'remoteCoreAttacker'
          | 'remoteDismantler'
          | 'scout'
          | 'claimer'
          | 'vanguard'
          | 'vanguardDefender'
          | 'antifaAssaulter'
          | 'antifaSupporter'

     type RoomObjectName =
          | 'terrainCM'
          | 'baseCM'
          | 'roadCM'
          | 'mineral'
          | 'source1'
          | 'source2'
          | 'structuresByType'
          | 'cSitesByType'
          | StructureConstant
          | `${StructureConstant}CSite`
          | 'enemyCSites'
          | 'allyCSites'
          | 'mineralHarvestPositions'
          | 'closestMineralHarvestPos'
          | 'source1HarvestPositions'
          | 'source1ClosestHarvestPos'
          | 'source2HarvestPositions'
          | 'source2ClosestHarvestPos'
          | 'centerUpgradePos'
          | 'upgradePositions'
          | 'fastFillerPositions'
          | 'labContainer'
          | 'usedMineralHarvestPositions'
          | 'usedSourceHarvestPositions'
          | 'usedUpgradePositions'
          | 'usedFastFillerPositions'
          | 'notMyCreeps'
          | 'myDamagedCreeps'
          | 'damagedAllyCreeps'
          | 'remoteNamesByEfficacy'

     interface PathGoal {
          pos: RoomPosition
          range: number
     }

     interface PathOpts {
          origin: RoomPosition
          goal: PathGoal
          /**
           * room types as keys to weight based on properties
           */
          typeWeights?: { [weight: string]: number }
          plainCost?: number
          swampCost?: number
          maxRooms?: number
          flee?: boolean
          creep?: Creep

          weightStructures?: { [weight: string]: StructureConstant[] }

          /**
           * An object with keys of weights and values of positions
           */

          weightPositions?: { [weight: string]: Pos[] | RoomPosition[] }

          /**
           *
           */
          weightCostMatrixes?: CostMatrix[]
          /**
           *
           */
          avoidEnemyRanges?: boolean

          avoidStationaryPositions?: boolean

          /**
           *
           */
          avoidImpassibleStructures?: boolean

          /**
           * Marks creeps not owned by the bot as avoid
           */
          avoidNotMyCreeps?: boolean

          /**
           * Weight my ramparts by this value
           */
          myRampartWeight?: number
     }

     interface FindClosestPosOfValueOpts {
          CM: CostMatrix
          startPos: Pos
          requiredValue: number
          reduceIterations?: number
          initialWeight?: number
          adjacentToRoads?: boolean
          roadCM?: CostMatrix
     }

     interface MoveRequestOpts extends PathOpts {
          cacheAmount?: number
     }

     type OrderedStructurePlans = BuildObj[]

     interface BuildObj {
          structureType: BuildableStructureConstant
          x: number
          y: number
     }

     interface SpawnRequestOpts {
          /**
           * Parts that should be attempted to be implemented once
           */
          defaultParts: BodyPartConstant[]
          /**
           * Parts that should be attempted to be implemented based on the partsMultiplier
           */
          extraParts: BodyPartConstant[]
          /**
           * The number of times to attempt to duplicate extraParts
           */
          partsMultiplier: number
          /**
           * The absolute minimum cost the creep may be spawned with
           */
          minCost: number
          /**
           * The priority of spawning, where 0 is greatest, and Infinity is least
           */
          priority: number
          /**
           * Properties to apply to the creep on top of the defaults
           */
          memoryAdditions: Partial<CreepMemory>
          /**
           * The specific group of which to compare the creep amount to
           */
          groupComparator?: string[]
          /**
           *
           */
          threshold?: number
          /**
           *
           */
          minCreeps?: number | undefined
          /**
           *
           */
          maxCreeps?: number | undefined
          /**
           * The absolute max cost a creep may be applied with
           */
          maxCostPerCreep?: number | undefined
     }

     interface ExtraOpts {
          memory: CreepMemory
          energyStructures: (StructureSpawn | StructureExtension)[]
          dryRun: boolean
     }

     interface SpawnRequest {
          body: BodyPartConstant[]
          tier: number
          cost: number
          extraOpts: ExtraOpts
     }

     type Reservations = 'transfer' | 'withdraw' | 'pickup'

     interface Reservation {
          type: Reservations
          amount: number
          resourceType: ResourceConstant
          targetID: Id<AnyStoreStructure | Creep | Tombstone | Resource>
     }

     interface ClaimRequest {
          needs: number[]
          /**
           * The weight for which to prefer this room, where higher values are prefered less
           */
          score: number
          /**
           * The number of ticks to abandon the claimRequest for
           */
          abadon?: number
     }

     interface ControllerLevel {
          level: number
          progress: number
          progressTotal: number
     }
     interface RoomStats {
          cl?: number // controllerLevel
          eih: number // energyInputHarvest
          eiet?: number // energyInputExternalTransferred
          eib?: number // energyInputBought
          eou?: number // energyOutputUpgrade
          eoro: number // energyOutputRepairOther
          eorwr?: number // energyOutputRepairWallOrRampart
          eob: number // energyOutputBuild
          eoso?: number // energyOutputSold
          eosp?: number // energyOutputSpawn
          mh?: number // mineralsHarvested
          es: number // energyStored
          cc: number // creepCount
          cu: number // cpuUsage
     }

     interface Stats {
          lastReset: number

          lastTickTimestamp: number
          tickLength: number

          communeCount: number

          resources: {
               pixels: number
               cpuUnlocks: number
               accessKeys: number
               credits: number
          }

          cpu: {
               bucket: number
               usage: number
          }

          memory: {
               usage: number
               limit: number
          }

          gcl: ControllerLevel

          gpl: ControllerLevel
          rooms: { [key: string]: RoomStats }
          constructionSiteCount: number
          debugCpu11: number
          debugCpu12: number
          debugCpu21: number
          debugCpu22: number
          debugCpu31: number
          debugCpu32: number
          debugRoomCount1: number
          debugRoomCount2: number
          debugRoomCount3: number
     }

     interface Memory {
          /**
           * The name of the user
           */
          me: string

          /**
           * IsMainShard
           */
          isMainShard: boolean

          /**
           * The current breaking version of the bot
           */
          breakingVersion: number | undefined

          /**
           * Wether the bot should generate any room visuals
           */
          roomVisuals: boolean

          /**
           * Wether the bot should generate base room visuals
           */
          baseVisuals: boolean

          /**
           * Wether the bot should generate map visuals
           */
          mapVisuals: boolean

          /**
           * Wether the bot should log CPU data
           */
          cpuLogging: boolean

          /**
           * Wether the bot save RoomStats data
           */
          roomStats: 0 | 1 | 2

          /**
           * A list of usernames to treat as allies
           */
          allyList: Set<string>

          /**
           * Wether the bot should sell pixels
           */
          pixelSelling: boolean

          /**
           * Wether the bot should generate pixels
           */
          pixelGeneration: boolean

          /**
           * An list of usernames to not trade with
           */
          tradeBlacklist: Set<string>

          /**
           * Wether the bot should automatically respond to claimRequests
           */
          autoClaim: boolean

          /**
           * Wether the bot should enable ramparts when there is no enemy present
           */
          publicRamparts: boolean

          /**
           * Wether the bot should try trading with its allies
           */
          allyTrading: boolean

          /**
           * An ongoing record of the latest ID assigned by the bot
           */
          ID: number

          /**
           * An object of constrctionsSites with keys of site IDs and properties of the site's age
           */
          constructionSites: { [key: string]: number }

          /**
           *
           */
          claimRequests: { [key: string]: ClaimRequest }

          attackRequests: { [key: string]: { needs: number[] } }

          /**
           * An array of roomNames that have controllers we own
           */
          communes: string[]

          stats: Partial<Stats>
     }

     interface RawMemory {
          [key: string]: any
     }

     type SpawningStructures = (StructureSpawn | StructureExtension)[]

     type SourceHarvestPositions = Map<number, boolean>[]

     interface OrganizedStructures {
          spawn: StructureSpawn[]
          extension: StructureExtension[]
          road: StructureRoad[]
          constructedWall: StructureWall[]
          rampart: StructureRampart[]
          keeperLair: StructureKeeperLair[]
          portal: StructurePortal[]
          controller: StructureController[]
          link: StructureLink[]
          storage: StructureStorage[]
          tower: StructureTower[]
          observer: StructureObserver[]
          powerBank: StructurePowerBank[]
          powerSpawn: StructurePowerSpawn[]
          extractor: StructureExtractor[]
          lab: StructureLab[]
          terminal: StructureTerminal[]
          container: StructureContainer[]
          nuker: StructureNuker[]
          factory: StructureFactory[]
          invaderCore: StructureInvaderCore[]
     }

     interface RoomGlobal {
          [key: string]: any

          // RoomObjects

          stampAnchors: StampAnchors

          sourceHarvestPositions: SourceHarvestPositions

          source1PathLength: number

          source2PathLength: number

          upgradePathLength: number

          // Containers

          source1Container: Id<StructureContainer> | undefined

          source2Container: Id<StructureContainer> | undefined

          fastFillerContainerLeft: Id<StructureContainer> | undefined

          fastFillerContainerRight: Id<StructureContainer> | undefined

          controllerContainer: Id<StructureContainer> | undefined

          mineralContainer: Id<StructureContainer> | undefined

          // Links

          source1Link: Id<StructureLink> | undefined

          source2Link: Id<StructureLink> | undefined

          controllerLink: Id<StructureLink> | undefined

          fastFillerLink: Id<StructureLink> | undefined

          hubLink: Id<StructureLink> | undefined
     }

     interface Room {
          /**
           * The amount of creeps with a task of harvesting sources in the room
           */
          creepsOfSourceAmount: { [key: string]: number }

          /**
           * An object with keys of roles with properties of arrays of creep names belonging to the role
           */
          myCreeps: { [key: string]: string[] }

          /**
           * The number of my creeps in the room
           */
          myCreepsAmount: number

          roomObjects: Partial<Record<RoomObjectName, RoomCacheObject>>

          /**
           * An object with keys of roles and properties of the number of creeps with the role from this room
           */
          creepsFromRoom: { [key: string]: string[] }

          /**
           * The cumulative amount of creeps with a communeName value of this room's name
           */
          creepsFromRoomAmount: number

          /**
           * An object with keys of roles and properties of the number of creeps with the role from this room
           */
          creepsFromRoomWithRemote: { [key: string]: { [key: string]: string[] } }

          /**
           * An object, if constructed, containing keys of resource types and values of the number of those resources in the room's terminal and storage
           */
          storedResources: { [key: string]: number }

          /**
           * A set of roomNames representing the targets of scouts from this commune
           */
          scoutTargets: Set<string>

          spawnRequests: { [priority: string]: SpawnRequest }

          // Functions

          /**
           * Uses caching and only operating on request to construct and get a specific roomObject based on its name
           * @param roomObjectName The name of the requested roomObject
           * @returns Either the roomObject's value, or, if the request failed, undefined
           */
          get(roomObjectName: RoomObjectName): any | undefined

          /**
           * Removes roomType-based values in the room's memory that don't match its type
           */
          cleanMemory(): void

          /**
           * Converts a custom Pos into a Game's RoomPosition
           */
          newPos(pos: Pos): RoomPosition

          /**
           *
           * @param pos1 The position of the thing performing the action
           * @param pos2 The position of the thing getting intereacted with
           * @param type The type of interaction, success if not provided
           */
          actionVisual(pos1: RoomPosition, pos2: RoomPosition, type?: string): void

          /**
           * Generates a path between two positions
           */
          advancedFindPath(opts: PathOpts): RoomPosition[]

          /**
           * Finds the amount of a specified resourceType in the room's storage and teminal
           */
          findStoredResourceAmount(resourceType: ResourceConstant): number

          /**
           * Tries to delete a task with the provided ID and response state
           */
          deleteTask(taskID: any, responder: boolean): void

          /**
           * Finds the type of a room and initializes its custom properties
           * @param scoutingRoom The room that is performing the scout operation
           */
          findType(scoutingRoom: Room): void

          makeRemote(scoutingRoom: Room): boolean

          /**
           * Finds the score of rooms for potential communes
           */
          findScore(): void

          /**
           * Finds and has towers heal damaged my or allied creeps
           */
          towersHealCreeps(): void

          towersAttackCreeps(): void

          towersRepairRamparts(): void

          /**
           * Finds open spaces in a room and records them in a cost matrix
           */
          distanceTransform(
               initialCM?: CostMatrix,
               enableVisuals?: boolean,
               x1?: number,
               y1?: number,
               x2?: number,
               y2?: number,
          ): CostMatrix

          /**
           * Finds open spaces in a room without adding depth to diagonals, and records the depth results in a cost matrix
           */
          diagonalDistanceTransform(
               initialCM?: CostMatrix,
               enableVisuals?: boolean,
               x1?: number,
               y1?: number,
               x2?: number,
               y2?: number,
          ): CostMatrix

          /**
           * Gets ranges from for each position from a certain point
           */
          floodFill(seeds: Pos[]): CostMatrix

          /**
           * Flood fills a room until it finds the closest pos with a value greater than or equal to the one specified
           */
          findClosestPosOfValue(opts: FindClosestPosOfValueOpts): RoomPosition | false

          /**
           *
           */
          pathVisual(path: RoomPosition[], color: keyof Colors): void

          /**
           * Finds amd records a construction site for builders to target
           */
          findCSiteTargetID(creep: Creep): boolean

          /**
           * Groups positions with contigiousness, structured similarily to a flood fill
           */
          groupRampartPositions(rampartPositions: number[], rampartPlans: CostMatrix): RoomPosition[][]

          /**
           *
           */
          findRoomPositionsInsideRect(x1: number, y1: number, x2: number, y2: number): RoomPosition[]

          /**
           *
           */
          createPullTask(creator: Structure | Creep | Resource): void

          /**
           *
           */
          createPickupTasks(creator: Structure | Creep | Resource): void

          /**
           *
           */
          createOfferTasks(creator: Structure | Creep | Resource): void

          /**
           *
           */
          createTransferTasks(creator: Structure | Creep | Resource): void

          /**
           *
           */
          createWithdrawTasks(creator: Structure | Creep | Resource): void

          /**
           * Crudely estimates a room's income by accounting for the number of work parts owned by sourceHarvesters
           */
          estimateIncome(): number

          getPartsOfRoleAmount(role: CreepRoles, type?: BodyPartConstant): number

          findSourcesByEfficacy(): ('source1' | 'source2')[]

          createClaimRequest(): boolean

          findSwampPlainsRatio(): number

          // General roomFunctions

          claimRequestManager(): void

          remotesManager(): void

          // Spawn functions

          spawnRequester(): void

          constructSpawnRequests(opts: SpawnRequestOpts | false): void

          decideMaxCostPerCreep(maxCostPerCreep: number): number

          createSpawnRequest(priority: number, body: BodyPartConstant[], tier: number, cost: number, memory: any): void

          spawnRequestIndividually(opts: SpawnRequestOpts): void

          spawnRequestByGroup(opts: SpawnRequestOpts): void

          // Market functions

          advancedSell(resourceType: ResourceConstant, amount: number): boolean

          advancedBuy(resourceType: ResourceConstant, amount: number): boolean

          // Construction functions

          remoteConstructionManager(): void

          remotePlanner(commune: Room): boolean

          clearOtherStructures(): void

          remoteConstructionPlacement(): void

          communeConstructionPlacement(): void

          // Link functions

          sourcesToReceivers(sourceLinks: (StructureLink | false)[], receiverLinks: (StructureLink | false)[]): void

          hubToFastFiller(hubLink: StructureLink | undefined, fastFillerLink: StructureLink | undefined): void

          hubToController(hubLink: StructureLink | undefined, controllerLink: StructureLink | undefined): void

          // Getters

          readonly global: Partial<RoomGlobal>

          _anchor: RoomPosition | undefined

          readonly anchor: RoomPosition | undefined

          _sources: Source[]

          readonly sources: Source[]

          _mineral: Mineral

          readonly mineral: Mineral

          _enemyCreeps: Creep[]

          readonly enemyCreeps: Creep[]

          _enemyAttackers: Creep[]

          readonly enemyAttackers: Creep[]

          _allyCreeps: Creep[]

          readonly allyCreeps: Creep[]

          _structures: Partial<OrganizedStructures>

          readonly structures: OrganizedStructures

          _cSites: Partial<Record<StructureConstant, ConstructionSite[]>>

          readonly cSites: Record<StructureConstant, ConstructionSite[]>

          readonly cSiteTarget: Id<ConstructionSite> | undefined

          _spawningStructures: SpawningStructures

          readonly spawningStructures: SpawningStructures

          _spawningStructuresByPriority: SpawningStructures

          readonly spawningStructuresByPriority: SpawningStructures

          _spawningStructuresByNeed: SpawningStructures

          readonly spawningStructuresByNeed: SpawningStructures

          _taskNeedingSpawningStructures: SpawningStructures

          readonly taskNeedingSpawningStructures: SpawningStructures

          readonly sourceHarvestPositions: SourceHarvestPositions

          _rampartPlans: CostMatrix

          readonly rampartPlans: CostMatrix

          readonly source1PathLength: number

          readonly source2PathLength: number

          readonly upgradePathLength: number

          // Container

          readonly source1Container: StructureContainer | undefined

          readonly source2Container: StructureContainer | undefined

          readonly fastFillerContainerLeft: StructureContainer | undefined

          readonly fastFillerContainerRight: StructureContainer | undefined

          readonly controllerContainer: StructureContainer | undefined

          readonly mineralContainer: StructureContainer | undefined

          // Links

          readonly source1Link: StructureLink | undefined

          readonly source2Link: StructureLink | undefined

          readonly controllerLink: StructureLink | undefined

          readonly fastFillerLink: StructureLink | undefined

          readonly hubLink: StructureLink | undefined

          _droppedEnergy: Resource[]

          readonly droppedEnergy: Resource[]

          _actionableWalls: StructureWall[]

          readonly actionableWalls: StructureWall[]

          _creepPositions: PackedPosMap

          /**
           * A matrix with indexes of packed positions and values of creep names
           */
          readonly creepPositions: PackedPosMap

          _moveRequests: PackedPosMap

          /**
           * A matrix with indexes of packed positions and values of creep names
           */
          readonly moveRequests: PackedPosMap

          // Target finding

          _MEWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          /**
           * Mandatory energy withdraw targets
           */
          readonly MEWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          _OEWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          /**
           * Optional energy withdraw targets
           */
          readonly OEWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          _MAWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          /**
           * Mandatory all withdraw targets
           */
          readonly MAWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          _OAWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          /**
           * Optional all withdraw targets
           */
          readonly OAWT: (Creep | AnyStoreStructure | Tombstone | Resource)[]

          _METT: (Creep | AnyStoreStructure | Tombstone)[]

          /**
           * Mandatory energy transfer targets
           */
          readonly METT: (Creep | AnyStoreStructure | Tombstone)[]

          _OETT: (Creep | AnyStoreStructure | Tombstone)[]

          /**
           * Optional energy transfer targets
           */
          readonly OETT: (Creep | AnyStoreStructure | Tombstone)[]

          _MATT: (Creep | AnyStoreStructure | Tombstone)[]

          /**
           * Mandatory all transfer targets
           */
          readonly MATT: (Creep | AnyStoreStructure | Tombstone)[]

          _OATT: (Creep | AnyStoreStructure | Tombstone)[]

          /**
           * Optional all transfer targets
           */
          readonly OATT: (Creep | AnyStoreStructure | Tombstone)[]
     }

     interface DepositRecord {
          decay: number
          needs: number[]
     }

     interface RoomMemory {
          [key: string]: any

          /**
           * A packed representation of the center of the fastFiller
           */
          anchor: number

          /**
           * A description of the room's defining properties that can be used to assume other properties
           */
          type: string

          /**
           * A set of names of remotes controlled by this room
           */
          remotes: string[]

          /**
           * If the room can be constructed by the base planner
           */
          notClaimable: boolean

          source1: Id<Source>
          source2: Id<Source>

          sourceIds: Id<Source>[]

          commune: string

          /**
           * A list of the efficacies of each source in the room
           */
          sourceEfficacies: number[]

          /**
           * A list of needs the remote wants met
           */
          needs: number[]

          /**
           * The room owner
           */
          owner: string

          /**
           * The controller's level
           */
          level: number

          powerEnabled: boolean

          /**
           * The number of towers in the room
           */
          towers: number

          /**
           * If a terminal is present in the room
           */
          hasTerminal: boolean

          /**
           * The amount of stored energy in the room
           */
          storedEnergy: number

          /**
           * A set of roomNames that portals in this room go to
           */
          portalsTo: string[]

          /**
           * The last tick the room was scouted at
           */
          lastScout: number | undefined

          /**
           * The room name of the commune's claim target
           */
          claimRequest: string

          cSiteTargetID: Id<ConstructionSite>

          stampAnchors: Partial<Record<StampTypes, number[]>>

          abandoned: number | undefined

          powerBanks: { [roomName: string]: number[] }

          deposits: Record<Id<Deposit>, DepositRecord>

          /**
           * Wether or not commune planning has been completed for the room
           */
          planned: boolean

          /**
           * Remote Planned, wether or not remote planning has been completed for the room
           */
          RP: boolean

          /**
           * Remote Stamp Anchors,
           */
          RSA: Partial<Record<RemoteStampTypes, string>>
     }

     // Creeps

     interface Creep {
          /**
           * The packed position of the moveRequest, if one has been made
           */
          moveRequest: number

          movedResource: boolean

          moved: boolean

          worked: boolean

          /**
           * Whether the creep is actively pulling another creep or not
           */
          pulling: boolean

          /**
           * Whether the creep is actively getting pulled by another creep or not
           */
          gettingPulled: boolean

          /**
           * The creep's opts when trying to make a moveRequest intra tick
           */
          pathOpts: PathOpts

          squad: Duo | Quad | undefined

          // Functions

          preTickManager(): void

          /**
           * Wether the creep's respawn time is equal to its remaining ticks to live
           */
          isDying(): boolean

          advancedPickup(target: Resource): boolean

          advancedTransfer(target: Creep | AnyStoreStructure, resourceType?: ResourceConstant, amount?: number): boolean

          advancedWithdraw(
               target: Creep | AnyStoreStructure | Tombstone,
               resourceType?: ResourceConstant,
               amount?: number,
          ): boolean

          /**
           * Harvests a source and informs the result, while recording the result if successful
           */
          advancedHarvestSource(source: Source): boolean

          /**
           * Attempts multiple methods to upgrade the controller
           */
          advancedUpgradeController(): boolean

          /**
           * Attempts multiple methods to build a construction site
           */
          advancedBuildCSite(cSite: ConstructionSite | undefined): boolean

          /**
           *
           */
          findRampartRepairTarget(workPartCount: number, excluded?: Set<Id<StructureRampart>>): Structure | false

          /**
           *
           */
          findRepairTarget(excluded?: Set<Id<Structure<StructureConstant>>>): Structure | false

          findOptimalSourceName(): boolean

          findSourceHarvestPos(sourceName: 'source1' | 'source2'): boolean

          findMineralHarvestPos(): boolean

          findFastFillerPos(): boolean

          /**
           *
           */
          needsNewPath(goalPos: RoomPosition, cacheAmount: number, path: RoomPosition[] | undefined): boolean

          /**
           *
           */
          createMoveRequest(opts: MoveRequestOpts): boolean

          findShovePositions(avoidPackedPositions: Set<number>): RoomPosition[]

          shove(shoverPos: RoomPosition): boolean

          /**
           * Try to enforce a moveRequest and inform the result
           */
          runMoveRequest(): boolean

          /**
           *
           */
          recurseMoveRequest(queue?: string[]): void

          /**
           * Decides if the creep needs to get more resources or not
           */
          needsResources(): boolean

          /**
           * Tries to sign a room's controller depending on the situation
           */
          advancedSignController(): boolean

          isOnExit(): boolean

          findTotalHealPower(range?: number): number

          advancedRecycle(): void

          advancedRenew(): boolean

          advancedReserveController(): boolean

          findCost(): number

          passiveHeal(): boolean

          aggressiveHeal(): boolean

          reserveWithdrawEnergy(): void

          reserveTransferEnergy(): void

          // Reservation

          deleteReservation(index: number): void

          createReservation(
               type: Reservations,
               target: Id<AnyStoreStructure | Creep | Tombstone | Resource>,
               amount: number,
               resourceType: ResourceConstant,
          ): void

          /**
           * Deletes reservations with no target, pre-emptively modifies store values
           */
          reservationManager(): void

          fulfillReservation(): boolean

          // Getters

          _strength: number

          /**
           * A numerical measurement of the combat abilites of the creep
           */
          readonly strength: number

          _healStrength: number

          readonly healStrength: number

          _reservation: Reservation | false

          readonly reservation: Reservation | false

          _parts: Partial<Record<BodyPartConstant, number>>

          readonly parts: Partial<Record<BodyPartConstant, number>>

          _boosts: Partial<Record<MineralBoostConstant, number>>

          readonly boosts: Partial<Record<MineralBoostConstant, number>>

          _towerDamage: number

          readonly towerDamage: number

          _message: string

          /**
           * The cumulative message to present in say()
           */
          message: string
     }

     interface CreepMemory {
          /**
           * Generally describes the body parts and tasks the creep is expected to do
           */
          role: CreepRoles

          /**
           * Wether the creep is old enough to need a replacement
           */
          dying: boolean

          /**
           * The energy the creep cost to spawn
           */
          cost: number

          /**
           * The name of the room the creep is from
           */
          communeName: string

          /**
           * A name of the creep's designated source
           */
          sourceName: 'source1' | 'source2'

          /**
           * The creep's packedPos for a designated target
           */
          packedPos: number

          /**
           * The last time a path was cached in memory
           */
          lastCache: number

          /**
           * An array of positions desciring where the creep neeeds to move to get to its goal
           */
          path: string

          goalPos: string

          /**
           * Whether the creep is intended to move on its own or not
           */
          getPulled: boolean

          repairTarget: Id<Structure>

          /**
           * The name of the room the scout is trying to scout
           */
          scoutTarget: string

          /**
           * The name of the room the creep is remoting for
           */
          remoteName: string

          /**
           * The target ID of the task
           */
          taskTarget: Id<Creep | AnyStoreStructure>

          reservations: Reservation[]

          dismantleTarget: Id<Structure>

          /**
           * Wether or not the creep Needs Resources
           */
          NR: boolean

          /**
           * Wether or not the creep should Use Roads
           */
          roads: boolean

          quota: number

          /**
           * The type of squad the creep is trying to form
           */
          squadType: 'quad' | 'duo' | undefined
     }

     // PowerCreeps

     interface PowerCreep {
          [key: string]: any
     }

     interface PowerCreepMemory {
          [key: string]: any
          role: string
     }

     // Structures

     interface Structure {
          realHits: number
     }

     interface StructureSpawn {
          /**
           * Wether the spawn has renewed a creep this tick
           */
          hasRenewed: boolean

          /**
           * Wether the structure has been transfered or withdrawn from
           */
          hasHadResourcesMoved: boolean

          // Functions

          advancedSpawn(spawnRequest: SpawnRequest): ScreepsReturnCode
     }

     interface StructureExtension {
          /**
           * Wether the structure has been transfered or withdrawn from
           */
          hasHadResourcesMoved: boolean
     }

     interface StructureTower {
          inactionable: boolean
     }

     interface RoomObject {
          // Functions

          /**
           * Finds the present total store usage number of this RoomObject
           */
          usedStore(): number

          /**
           * Finds the total free store capacity of this RoomObject
           * @param resourceType A resourceConstant to ensure proper querying of limit store RoomObjects
           */
          freeStore(resourceType: ResourceConstant): number

          /**
           * Finds the total free store capacity of a specific resource for this RoomObject
           */
          freeSpecificStore(resourceType: ResourceConstant): number
     }

     interface Resource {
          // Getters

          _reserveAmount: number

          reserveAmount: number
     }

     // Global

     namespace NodeJS {
          interface Global {
               [key: string]: any

               /**
                * Whether global is constructed or not
                */
               constructed: true | undefined

               /**
                * A strings to custom log as rich text
                */
               logs: string

               /**
                * The number of construction sites placed by the bot
                */
               constructionSitesCount: number

               packedRoomNames: { [roomManager: string]: string }

               unpackedRoomNames: { [key: string]: string }
               roomStats: { [key: string]: RoomStats }

               // Command functions

               /**
                * Deletes all properties of Memory
                */
               clearMemory(): string

               /**
                * Kills all creeps owned by the bot
                */
               killAllCreeps(roles?: CreepRoles[]): string

               /**
                * Removes all specified construction sites owned by the bot
                */
               removeAllCSites(types?: BuildableStructureConstant[]): string

               /**
                * Destroys all specified structures owned by the bot
                */
               destroyAllStructures(roomName: string, types?: StructureConstant[]): string

               /**
                * Destroys all specified structures in communes
                */
               destroyCommuneStructures(types?: StructureConstant[]): string

               /**
                * Responds, or if needed, creates, a claim request for a specified room, by a specified room
                * @param claimRequest The roomName of the claimRequest to respond to
                * @param commune The commune to respond to the claimRequest
                */
               claim(claimRequest: string, communeName: string): string
          }
     }
}

// Loop

export const loop = function () {
     memHack.modifyMemory()

     internationalManager.run()

     roomManager()

     internationalManager.mapVisualsManager()

     internationalManager.advancedGeneratePixel()
     internationalManager.advancedSellPixels()
     /*
     let cpu = Game.cpu.getUsed()

     createPackedPosMap()

     customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu)
 */
     internationalManager.endTickManager()
     // console.log('Stats cpu logging')
     // console.log(
     //      `Non stats room count: ${Memory.stats.debugRoomCount1} - Pre: ${Memory.stats.debugCpu11} - End: ${
     //           Memory.stats.debugCpu12
     //      } - Per room: ${((Memory.stats.debugCpu11 + Memory.stats.debugCpu12) / Memory.stats.debugRoomCount1).toFixed(
     //           4,
     //      )}`,
     // )
     // console.log(
     //      `Commune stats room count: ${Memory.stats.debugRoomCount2} - Pre: ${Memory.stats.debugCpu21} - End: ${
     //           Memory.stats.debugCpu22
     //      } - Per room: ${((Memory.stats.debugCpu21 + Memory.stats.debugCpu22) / Memory.stats.debugRoomCount2).toFixed(
     //           4,
     //      )}`,
     // )
     // console.log(
     //      `Remote stats room count: ${Memory.stats.debugRoomCount3} - Pre: ${Memory.stats.debugCpu31} - End: ${
     //           Memory.stats.debugCpu32
     //      } - Per room: ${((Memory.stats.debugCpu31 + Memory.stats.debugCpu32) / Memory.stats.debugRoomCount3).toFixed(
     //           4,
     //      )}`,
     // )
}
