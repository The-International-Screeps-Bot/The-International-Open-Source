import { customLog, findClosestObject, getRange, unpackAsPos } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import './spawning/spawnManager'

import './towers'
import { constructionManager } from './construction/constructionManager'
import './defence'
import './links'
import './allyCreepRequestManager'
import './claimRequestManager'
import { myColors, safemodeTargets } from 'international/constants'
import { packCoord, packCoordList, packPosList } from 'other/packrat'
import { internationalManager } from 'international/internationalManager'

/**
 * Handles managers for exclusively commune-related actions
 */
export function communeManager(room: Room) {
    constructionManager(room)

    room.defenceManager()

    room.towerManager()

    marketManager(room)

    room.linkManager()

    room.claimRequestManager()

    room.allyCreepRequestManager()

    room.spawnManager()

    // Testing stuff, feel welcome to use to test CPU usage for specific commune things

   for (const packedCoord in internationalManager.getTerrainCoords(room.name)) {

      const coord = unpackAsPos(parseInt(packedCoord))

      customLog('COORD', coord.x, + ', ' + coord.y + ',  ' + packedCoord)
   }

/*
    for (const remoteName of room.memory.remotes) {

         const remote = Game.rooms[remoteName]
         if (!remote) continue

         for (const positions of remote.sourcePaths) {

            let previousPos

            for (const pos of positions) {

               const posRoom = Game.rooms[pos.roomName]
               if (!posRoom) continue

               if (!previousPos || pos.roomName !== previousPos.roomName) {

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

   room.cSiteTarget

    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
 */
    /*
   cpu = Game.cpu.getUsed()



   customLog('CPU USED FOR TEST 2', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
   */
}
