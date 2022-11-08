import { createPosMap, customLog, findClosestObject, getRange } from 'international/utils'
import { TradeManager } from './market/tradeManager'
import './spawning/spawnManager'

import { constructionManager } from '../construction/constructionManager'
import './defence'
import './allyCreepRequestManager'
import './claimRequestManager'
import './combatRequestManager'
import { creepRoles, myColors, remoteRoles, roomDimensions, stamps } from 'international/constants'
import './factory'
import { LabManager } from './labs'
import './towers'
import './links'
import { RoomVisualsManager } from '../roomVisuals'
import { EndTickCreepManager } from '../creeps/endTickCreepManager'
import { CreepRoleManager } from '../creeps/creepRoleManager'
import { RemotesManager } from './remotesManager'
import { ClaimRequestManager } from './claimRequestManager'
import { CombatRequestManager } from './combatRequestManager'
import { AllyCreepRequestManager } from './allyCreepRequestManager'
import { PowerSpawnManager } from './powerSpawn'
import './haulerSize'
import { SourceManager } from './sourceManager'
import { TowerManager } from './towers'
import { DefenceManager } from './defence'
import { SpawnManager } from './spawning/spawnManager'
import { HaulRequestManager } from './haulRequestManager'
import { HaulerSizeManager } from './haulerSize'
import { HaulerNeedManager } from './haulerNeedManager'

export class CommuneManager {
    defenceManager: DefenceManager

    towerManager: TowerManager
    labManager: LabManager
    powerSpawnManager: PowerSpawnManager
    spawnManager: SpawnManager
    sourceManager: SourceManager

    tradeManager: TradeManager
    remotesManager: RemotesManager
    haulerSizeManager: HaulerSizeManager

    claimRequestManager: ClaimRequestManager
    combatRequestManager: CombatRequestManager
    allyCreepRequestManager: AllyCreepRequestManager
    haulRequestManager: HaulRequestManager
    haulerNeedManager: HaulerNeedManager

    //

    constructor() {
        this.defenceManager = new DefenceManager(this)

        this.towerManager = new TowerManager(this)
        this.labManager = new LabManager(this)
        this.powerSpawnManager = new PowerSpawnManager(this)
        this.spawnManager = new SpawnManager(this)
        this.sourceManager = new SourceManager(this)

        this.tradeManager = new TradeManager(this)
        this.remotesManager = new RemotesManager(this)
        this.haulerSizeManager = new HaulerSizeManager(this)

        this.claimRequestManager = new ClaimRequestManager(this)
        this.combatRequestManager = new CombatRequestManager(this)
        this.allyCreepRequestManager = new AllyCreepRequestManager(this)
        this.haulRequestManager = new HaulRequestManager(this)
        this.haulerNeedManager = new HaulerNeedManager(this)
    }

    room: Room
    structures: OrganizedStructures

    public update(room: Room) {
        this.room = room
        this.structures = room.structures
    }

    preTickRun() {

        const { room } = this

        const roomMemory = Memory.rooms[room.name]

        room.memory.T = 'commune'

        if (!roomMemory.GRCL || room.controller.level > roomMemory.GRCL) roomMemory.GRCL = room.controller.level

        if (!room.memory.combatRequests) room.memory.combatRequests = []
        if (!room.memory.haulRequests) room.memory.haulRequests = []

        room.spawnRequests = {}
        room.upgradeStrength = 0
        room.haulerNeed = 0

        if (!room.memory.remotes) room.memory.remotes = []

        // If there is no Hauler Size

        if (!room.memory.MHC) {
            room.memory.MHC = 0
            room.memory.HU = 0
        }

        this.haulerSizeManager.preTickRun()
        this.remotesManager.preTickRun()
        this.haulRequestManager.preTickRun()
        this.sourceManager.preTickRun()

        // Add roomName to commune list

        global.communes.add(room.name)

        room.creepsOfRemote = {}

        for (let index = room.memory.remotes.length - 1; index >= 0; index -= 1) {
            const remoteName = room.memory.remotes[index]
            room.creepsOfRemote[remoteName] = {}
            for (const role of remoteRoles) room.creepsOfRemote[remoteName][role] = []
        }

        // For each role, construct an array for creepsFromRoom

        room.creepsFromRoom = {}
        for (const role of creepRoles) room.creepsFromRoom[role] = []

        room.creepsFromRoomAmount = 0

        if (!room.memory.stampAnchors) {
            room.memory.stampAnchors = {}

            for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
        }

        if (room.creepsFromRoom.scout) room.scoutTargets = new Set()

        if (!room.memory.deposits) room.memory.deposits = {}

        room.attackingDefenderIDs = new Set()
        room.defenderEnemyTargetsWithDamage = new Map()
        room.defenderEnemyTargetsWithDefender = new Map()
    }

    public run() {
        constructionManager(this.room)

        this.defenceManager.run()

        this.towerManager.run()

        try {
            this.tradeManager.run()
        } catch (err) {
            customLog(
                'Exception processing tradeManager in ' + this.room.name + '. ',
                err + '\n' + (err as any).stack,
                myColors.white,
                myColors.red,
            )
        }

        this.claimRequestManager.run()
        this.combatRequestManager.run()
        this.allyCreepRequestManager.run()
        this.haulRequestManager.run()
        this.remotesManager.run()
        this.haulerNeedManager.run()

        this.sourceManager.run()
        this.room.linkManager()
        this.room.factoryManager()
        this.labManager.run()
        this.powerSpawnManager.run()
        this.spawnManager.run()

        this.test()
    }

    private test() {

        customLog('HAULER NEED', this.room.haulerNeed)

        return

        let CPUUsed = Game.cpu.getUsed()

        customLog('CPU TEST 1', Game.cpu.getUsed() - CPUUsed, undefined, myColors.red)
    }

    public deleteCombatRequest(requestName: string, index: number) {

        delete Memory.combatRequests[requestName]
        this.room.memory.combatRequests.splice(index, 1)
    }

    get storedEnergyUpgradeThreshold() {
        return this.room.controller.level * 10000
    }

    get storedEnergyBuildThreshold() {
        return this.room.controller.level * 8000
    }

    /**
     * The minimum amount of stored energy the room should only use in emergencies
     */
    get storedEnergyMin() {
        return Math.pow(this.room.controller.level * 8000, 1.05)
    }
 }
