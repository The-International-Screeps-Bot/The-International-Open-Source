import { findObjectWithID } from "international/generalFunctions"
import { Builder } from "../../creepClasses"

export function builderManager(room: Room, creepsOfRole: string[]) {

    // If there is no construction target ID

    if (!global[room.name].cSiteTargetID) {

        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
    }

    // Convert the construction target ID into a game object

    let constructionTarget: ConstructionSite | undefined = findObjectWithID(global[room.name].cSiteTargetID)

    // If there is no construction target

    if (!constructionTarget) {

        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(Game.creeps[creepsOfRole[0]])
    }

    // Convert the construction target ID into a game object, stopping if it's undefined

    constructionTarget = findObjectWithID(global[room.name].cSiteTargetID)

    // Loop through creep names of creeps of the manager's role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Builder = Game.creeps[creepName]

        // If there is a cSite, try to build it and iterate

        if (creep.advancedBuildCSite(constructionTarget)) continue

        // Otherwise, recycle the creep

        creep.advancedRecycle()
    }
}
