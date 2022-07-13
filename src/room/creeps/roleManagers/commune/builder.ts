import { findObjectWithID, getRange } from 'international/generalFunctions'
import { Builder } from '../../creepClasses'

export function builderManager(room: Room, creepsOfRole: string[]) {
     // If there is no construction target ID

     if (!room.memory.cSiteTargetID) {
          // Try to find a construction target. If none are found, stop

          room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
     }

     // Convert the construction target ID into a game object

     let constructionTarget: ConstructionSite | undefined = findObjectWithID(room.memory.cSiteTargetID)

     // If there is no construction target

     if (!constructionTarget) {
          // Try to find a construction target. If none are found, stop

          room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
     }

     // Convert the construction target ID into a game object, stopping if it's undefined

     constructionTarget = findObjectWithID(room.memory.cSiteTargetID)

     // Loop through creep names of creeps of the manager's role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: Builder = Game.creeps[creepName]

          if (!constructionTarget) {
               creep.advancedRecycle()
               continue
          }

          // If the creep needs resources

          if (creep.needsResources()) {
               // If there are no sourceHarvesters in the room, harvest a source

               if (!(room.myCreeps.source1Harvester.length + room.myCreeps.source2Harvester.length)) {
                    const sources = room.find(FIND_SOURCES_ACTIVE)
                    if (!sources.length) continue

                    const source = creep.pos.findClosestByPath(sources, {
                         ignoreCreeps: true,
                    })

                    if (getRange(creep.pos.x, source.pos.x, creep.pos.y, source.pos.y) > 1) {
                         creep.createMoveRequest({
                              origin: creep.pos,
                              goal: { pos: source.pos, range: 1 },
                              avoidEnemyRanges: true,
                         })

                         continue
                    }

                    creep.advancedHarvestSource(source)
                    continue
               }

               // If there are fastFiller containers

               if (!room.fastFillerContainerLeft && !room.fastFillerContainerRight) continue

               if (!creep.memory.reservations || !creep.memory.reservations.length) creep.reserveWithdrawEnergy()

               if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
               }

               creep.reserveWithdrawEnergy()

               if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
               }

               if (creep.needsResources()) continue
          }

          // If there is a cSite, try to build it and iterate

          if (creep.advancedBuildCSite(constructionTarget)) continue
     }
}
