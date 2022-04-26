import { findObjectWithID, getRange } from "international/generalFunctions"
import { RoomTask } from "room/roomTasks"
import { Builder } from "../../creepClasses"

export function builderManager(room: Room, creepsOfRole: string[]) {

    // If there is no construction target ID

    if (!room.global.cSiteTargetID) {

        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
    }

    // Convert the construction target ID into a game object

    let constructionTarget: ConstructionSite | undefined = findObjectWithID(room.global.cSiteTargetID)

    // If there is no construction target

    if (!constructionTarget) {

        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
    }

    // Convert the construction target ID into a game object, stopping if it's undefined

    constructionTarget = findObjectWithID(room.global.cSiteTargetID)

    // Loop through creep names of creeps of the manager's role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Builder = Game.creeps[creepName]

        // If the creep needs resources

        if (creep.needsResources()) {

            // If there are no sourceHarvesters in the room, harvest a source

            if (!room.myCreeps.sourceHarvester.length) {

                const sources = room.find(FIND_SOURCES_ACTIVE)
                if (!sources.length) continue

                const source = creep.pos.findClosestByRange(sources)

                if (getRange(creep.pos.x - source.pos.x, creep.pos.y - source.pos.y) > 1) {

                    creep.createMoveRequest({
                        origin: creep.pos,
                        goal: { pos: source.pos, range: 1 },
                        avoidEnemyRanges: true,
                        weightGamebjects: {
                            1: room.get('road')
                        }
                    })

                    continue
                }

                creep.advancedHarvestSource(source)
                continue
            }

            creep.say('DR')

            // If creep has a task

            if (global[creep.id]?.respondingTaskID) {

                // Try to filfill task

                const fulfillTaskResult = creep.fulfillTask()

                // If the task wasn't fulfilled, inform true

                if (!fulfillTaskResult) continue

                // Otherwise find the task

                const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

                // Delete it and inform true

                task.delete()
                continue
            }

            // Otherwise try to find a new task

            creep.findTask(new Set([
                'pickup',
                'withdraw',
                'offer'
            ]), RESOURCE_ENERGY)

            continue
        }

        // If there is a cSite, try to build it and iterate

        if (creep.advancedBuildCSite(constructionTarget)) continue

        // Otherwise, recycle the creep

        creep.advancedRecycle()
    }
}
