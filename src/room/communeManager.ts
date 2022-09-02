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

import './towers'
import { constructionManager } from './construction/constructionManager'
import './defence'
import './links'
import './allyCreepRequestManager'
import './claimRequestManager'
import './attackRequestManager'
import { myColors, roomDimensions } from 'international/constants'
import './factory'
import './lab'
import { LabManager } from './lab'

export class CommuneManager {
    labManager: LabManager
    marketManager: MarketManager

    constructor() {
        this.labManager = new LabManager(this)
        this.marketManager = new MarketManager(this)
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


        try { this.marketManager.run(); } catch (err) {
            customLog('Exception processing marketManager in ' + this.room.name + '. ', err + '\n' + (err as any).stack, myColors.white, myColors.red);
          }

        this.room.linkManager()

        this.room.claimRequestManager()
        this.room.attackRequestManager()

        this.room.allyCreepRequestManager()

        this.room.spawnManager()

        this.room.factoryManager()
        this.labManager.run()
    }
}
