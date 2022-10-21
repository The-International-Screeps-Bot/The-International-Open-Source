import { createPosMap, customLog, findClosestObject, getRange } from 'international/utils'
import { TradeManager } from './market/tradeManager'
import './spawning/spawnManager'

import { constructionManager } from './construction/constructionManager'
import './defence'
import './allyCreepRequestManager'
import './claimRequestManager'
import './combatRequestManager'
import { myColors, roomDimensions } from 'international/constants'
import './factory'
import { LabManager } from './lab'
import './towers'
import './links'
import { RoomVisualsManager } from './roomVisuals'
import { EndTickCreepManager } from './creeps/endTickCreepManager'
import { CreepRoleManager } from './creeps/creepRoleManager'
import { RemotesManager } from './remotesManager'
import { ClaimRequestManager } from './claimRequestManager'
import { CombatRequestManager } from './combatRequestManager'
import { AllyCreepRequestManager } from './allyCreepRequestManager'
import { PowerSpawnManager } from './powerSpawn'

export class CommuneManager {
    labManager: LabManager
    powerSpawnManager: PowerSpawnManager

    tradeManager: TradeManager
    remotesManager: RemotesManager

    claimRequestManager: ClaimRequestManager
    combatRequestManager: CombatRequestManager
    allyCreepRequestManager: AllyCreepRequestManager

    constructor() {
        this.labManager = new LabManager(this)
        this.powerSpawnManager = new PowerSpawnManager(this)

        this.tradeManager = new TradeManager(this)
        this.remotesManager = new RemotesManager(this)

        this.claimRequestManager = new ClaimRequestManager(this)
        this.combatRequestManager = new CombatRequestManager(this)
        this.allyCreepRequestManager = new AllyCreepRequestManager(this)
    }

    room: Room
    structures: OrganizedStructures

    public update(room: Room) {
        this.room = room
        this.structures = room.structures
    }

    public run() {
        constructionManager(this.room)

        this.room.defenceManager()
        this.room.towerManager()

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
        this.remotesManager.stage2()

        this.room.linkManager()
        this.room.factoryManager()
        this.labManager.run()
        this.powerSpawnManager.run()
        this.room.spawnManager()

        this.test()
    }
    private test() {
        return

        let CPUUsed = Game.cpu.getUsed()

        customLog('STORED ENERGY', this.room.resourcesInStoringStructures.energy)

        customLog('CPU TEST 1', Game.cpu.getUsed() - CPUUsed)
    }

    get storedEnergyUpgradeThreshold() {
        return this.room.controller.level * 10000
    }

    get storedEnergyBuildThreshold() {
        return this.room.controller.level * 8000
    }
}
