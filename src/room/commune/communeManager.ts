import {
    cleanRoomMemory,
    createPosMap,
    customLog,
    findClosestObject,
    getRange,
    unpackNumAsCoord,
} from 'international/utils'
import { TradeManager } from './market/tradeManager'
import './spawning/spawnManager'

import { constructionManager } from '../construction/constructionManager'
import './defence'
import './allyCreepRequestManager'
import './claimRequestManager'
import './combatRequestManager'
import {
    creepRoles,
    impassibleStructureTypesSet,
    myColors,
    remoteRoles,
    roomDimensions,
    stamps,
} from 'international/constants'
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
import { packXYAsCoord, unpackCoord, unpackPosList } from 'other/packrat'

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

        room.spawnRequests = []
        room.upgradeStrength = 0
        room.haulerNeed = 0

        if (!room.memory.remotes) room.memory.remotes = []

        // If there is no Hauler Size

        if (!room.memory.MHC) {
            room.memory.MHC = 0
            room.memory.HU = 0
        }

        if (roomMemory.AT == undefined) roomMemory.AT = 0

        room.usedRampartIDs = new Set()

        this.haulerSizeManager.preTickRun()
        this.remotesManager.preTickRun()
        this.haulRequestManager.preTickRun()
        this.sourceManager.preTickRun()
        this.claimRequestManager.preTickRun()

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

        room.scoutTargets = new Set()

        if (!room.memory.deposits) room.memory.deposits = {}

        room.attackingDefenderIDs = new Set()
        room.defenderEnemyTargetsWithDamage = new Map()
        room.defenderEnemyTargetsWithDefender = new Map()
    }

    public run() {
        constructionManager(this.room)

        this.defenceManager.run()
        this.towerManager.run()
        this.defenceManager.manageThreat()
        this.defenceManager.manageDefenceRequests()

        try {
            this.tradeManager.run()
        } catch (err) {
            customLog(
                'Exception processing tradeManager in ' + this.room.name + '. ',
                err + '\n' + (err as any).stack,
                {
                    textColor: myColors.white,
                    bgColor: myColors.red,
                },
            )
        }

        this.claimRequestManager.run()
        this.combatRequestManager.run()
        this.allyCreepRequestManager.run()
        this.haulRequestManager.run()
        this.sourceManager.run()
        this.remotesManager.run()
        this.haulerNeedManager.run()

        this.room.linkManager()
        this.room.factoryManager()
        this.labManager.run()
        this.powerSpawnManager.run()
        this.spawnManager.organizeSpawns()

        this.room.roomManager.creepRoleManager.run()
        this.room.roomManager.powerCreepRoleManager.run()

        this.spawnManager.run()

        this.room.roomManager.endTickCreepManager.run()
        this.room.roomManager.roomVisualsManager.run()

        this.test()
    }

    private test() {
        return

        let CPUUsed = Game.cpu.getUsed()

        customLog('CPU TEST 1', Game.cpu.getUsed() - CPUUsed, {
            bgColor: myColors.red,
        })
    }

    public deleteCombatRequest(requestName: string, index: number) {
        delete Memory.combatRequests[requestName]
        this.room.memory.combatRequests.splice(index, 1)
    }

    public removeRemote(remoteName: string, index: number) {
        this.room.memory.remotes.splice(index, 1)

        const remoteMemory = Memory.rooms[remoteName]

        delete remoteMemory.CN
        remoteMemory.T = 'neutral'
        cleanRoomMemory(remoteName)
    }

    public findMinRangedAttackCost(minDamage: number = 10) {
        return (
            (minDamage / RANGED_ATTACK_POWER) * BODYPART_COST[RANGED_ATTACK] +
            (minDamage / RANGED_ATTACK_POWER) * BODYPART_COST[MOVE]
        )
    }

    public findMinMeleeAttackCost(minDamage: number = 30) {
        return (minDamage / ATTACK_POWER) * BODYPART_COST[ATTACK] + (minDamage / ATTACK_POWER) * BODYPART_COST[MOVE]
    }

    /**
     * Finds how expensive it will be to provide enough heal parts to withstand a melee attack
     */
    public findMinMeleeHealCost(minHeal: number = 0) {
        return (
            minHeal / HEAL_POWER * BODYPART_COST[HEAL] +
            minHeal / HEAL_POWER * BODYPART_COST[MOVE]
        )
    }

    /**
     * Finds how expensive it will be to provide enough heal parts to withstand a ranged attack
     */
    public findMinRangedHealCost(minHeal: number = 0) {
        return (
            minHeal / HEAL_POWER * BODYPART_COST[HEAL] +
            minHeal / HEAL_POWER * BODYPART_COST[MOVE]
        )
    }

    public findMinDismantleCost(minDismantle: number = 0) {
        return minDismantle * BODYPART_COST[WORK] + minDismantle * BODYPART_COST[MOVE]
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
    get minStoredEnergy() {
        return Math.floor(Math.pow(this.room.controller.level * 8000, 1.05) + this.room.memory.AT * 20)
    }

    get minRampartHits() {
        const level = this.room.controller.level

        return Math.min(
            Math.floor(Math.pow((level - 3) * 10, 4.5) + 20000 + this.room.memory.AT * Math.pow(level, 1.8) * 10),
            RAMPART_HITS_MAX[level],
        )
    }
}
