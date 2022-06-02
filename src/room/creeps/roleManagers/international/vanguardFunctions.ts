import { claimRequestNeedsIndex } from 'international/constants'
import { customLog, findObjectWithID, getRange, unpackAsPos } from 'international/generalFunctions'
import { Vanguard } from '../../creepClasses'

Vanguard.prototype.travelToSource = function (sourceName) {
     const creep = this
     const { room } = creep

     creep.say('FHP')

     // Try to find a harvestPosition, inform false if it failed

     if (!creep.findSourceHarvestPos(sourceName)) return false

     creep.say('🚬')

     // Unpack the harvestPos

     const harvestPos = unpackAsPos(creep.memory.packedPos)

     // If the creep is at the creep's packedHarvestPos, inform false

     if (getRange(creep.pos.x - harvestPos.x, creep.pos.y - harvestPos.y) === 0) return false

     // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

     creep.say(`⏩ ${sourceName}`)

     creep.createMoveRequest({
          origin: creep.pos,
          goal: {
               pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
               range: 0,
          },
          avoidEnemyRanges: true,
          cacheAmount: 50,
     })

     return true
}

Vanguard.prototype.buildRoom = function () {
     const creep = this
     const { room } = creep

     if (creep.needsResources()) {
          // Define the creep's sourceName

          if (!creep.findOptimalSourceName()) return

          const { sourceName } = creep.memory

          // Try to move to source. If creep moved then iterate

          if (creep.travelToSource(sourceName)) return

          // Try to normally harvest. Iterate if creep harvested

          if (creep.advancedHarvestSource(room.get(sourceName))) return
          return
     }

     // If there is no construction target ID

     if (!room.memory.cSiteTargetID) {
          // Try to find a construction target. If none are found, stop

          room.findCSiteTargetID(creep)
     }

     // Convert the construction target ID into a game object

     let constructionTarget: ConstructionSite | undefined = findObjectWithID(room.memory.cSiteTargetID)

     // If there is no construction target

     if (!constructionTarget) {
          // Try to find a construction target. If none are found, stop

          room.findCSiteTargetID(creep)
     }

     // Convert the construction target ID into a game object, stopping if it's undefined

     constructionTarget = findObjectWithID(room.memory.cSiteTargetID)

     creep.advancedBuildCSite(constructionTarget)
}
