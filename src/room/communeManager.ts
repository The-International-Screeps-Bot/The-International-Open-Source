import {
    createPosMap,
    customLog,
    findClosestObject,
    getRange,
    pack,
    packXY,
    unpackAsPos,
} from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import './spawning/spawnManager'

import './towers'
import { constructionManager } from './construction/constructionManager'
import './defence'
import './links'
import './allyCreepRequestManager'
import './claimRequestManager'

/**
 * Handles managers for exclusively commune-related actions
 */
Room.prototype.communeManager = function() {
    constructionManager(this)

    this.defenceManager()

    this.towerManager()

    marketManager(this)

    this.linkManager()

    this.claimRequestManager()

    this.allyCreepRequestManager()

    this.spawnManager()

    this.factoryManager()

    // Testing stuff, feel welcome to use to test CPU usage for specific commune things

    /*
    for (const remoteName of this.memory.remotes) {

         const remote = Game.thiss[remoteName]
         if (!remote) continue

         for (const positions of remote.sourcePaths) {

            let previousPos

            for (const pos of positions) {

               const posRoom = Game.thiss[pos.thisName]
               if (!posRoom) continue

               if (!previousPos || pos.thisName !== previousPos.thisName) {

                  posRoom.visual.circle(pos, { fill: myColors.lightBlue, opacity: 0.2 })
                  previousPos = pos

                  continue
               }

               posRoom.visual.line(pos, previousPos, { color: myColors.lightBlue, opacity: 0.2 })
               previousPos = pos
            }
         }
    }
 */
/*
    let cpu = Game.cpu.getUsed()



    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
 */
/*
    cpu = Game.cpu.getUsed()



    customLog('CPU USED FOR TEST 2', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
     */
}
