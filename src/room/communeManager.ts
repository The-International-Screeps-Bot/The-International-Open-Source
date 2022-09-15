import {
    createPosMap,
    customLog,
    findClosestObject,
    getRange,
    pack,
    packXY,
    unpackAsPos,
} from 'international/generalFunctions'
import { MarketManager } from './market/marketManager'
import './spawning/spawnManager'

import { constructionManager } from './construction/constructionManager'
import './defence'
import './allyCreepRequestManager'
import './claimRequestManager'
import './attackRequestManager'
import { myColors, roomDimensions } from 'international/constants'
import './factory'
import { LabManager } from './lab'
import './towers'
import './links'
import { RoomVisualsManager } from './roomVisuals'
import { EndTickCreepManager } from './creeps/endTickCreepManager'
import { CreepRoleManager } from './creeps/creepRoleManager'
import { RemotesManager } from './remotesManager'

export class CommuneManager {
    labManager: LabManager
    marketManager: MarketManager
    remotesManager: RemotesManager

    constructor() {
        this.labManager = new LabManager(this)
        this.marketManager = new MarketManager(this)
        this.remotesManager = new RemotesManager(this)
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
            this.marketManager.run()
        } catch (err) {
            customLog(
                'Exception processing marketManager in ' + this.room.name + '. ',
                err + '\n' + (err as any).stack,
                myColors.white,
                myColors.red,
            )
        }

        this.room.linkManager()

        this.room.claimRequestManager()
        this.room.attackRequestManager()

        this.room.allyCreepRequestManager()

        this.remotesManager.stage2()

        this.room.spawnManager()

        this.room.factoryManager()
        this.labManager.run()

        this.test()
    }
    private test() {
        return

        let CPUUsed = Game.cpu.getUsed()

        const cm = new PathFinder.CostMatrix()
        customLog('SERIALIZED CM', cm.serialize())

        customLog('CPU TEST 1', Game.cpu.getUsed() - CPUUsed)
    }

    get storedEnergyUpgradeThreshold() {

        return this.room.controller.level * 10000
    }

    get storedEnergyBuildThreshold() {

        return this.room.controller.level * 8000
    }
}
