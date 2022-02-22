import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"

/**
 * Adds annotations to the room if roomVisuals are enabled
 */
export function roomVisualsManager(room: Room) {

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // Get the anchor

    const anchor: RoomPosition = room.get('anchor')

    // If there is an anchor, show a rectangle around it

    if (anchor) room.visual.rect(anchor.x - 0.5, anchor.y - 0.5, 1, 1, {
        stroke: constants.colors.lightBlue,
        fill: 'transparent',
    })

    controllerVisuals()

    function controllerVisuals() {

        // Stop if there is no controller

        if (!room.controller) return

        // If the controller is mine

        if (room.controller.my) {

            // If the controller level is less than 8, show percentage to next level

            if(room.controller.level < 8) room.visual.text(`%${(room.controller.progress / room.controller.progressTotal * 100).toFixed(2)}`, room.controller.pos.x, room.controller.pos.y - 1, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: constants.colors.lightBlue,
            })

            // Show the controller's level

            room.visual.text(`${room.controller.level}`, room.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8
            })
            return
        }

        // If the controller is reserved

        if (room.controller.reservation) {

            let color: string

            reservationColor()

            function reservationColor() {

                if (room.controller.reservation.username == constants.me) {

                    color = constants.colors.lightBlue
                    return
                }

                if (constants.allyList.has(room.controller.reservation.username)) {

                    color = constants.colors.green
                    return
                }

                color = constants.colors.red
            }

            // Show the reservation time

            room.visual.text(`${room.controller.reservation.ticksToEnd}`, room.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8,
                color
            })
            return
        }
    }

    spawnVisuals()

    function spawnVisuals() {

        // Get the spawns in the room

        const spawns: StructureSpawn[] = room.get('spawn')

        // Loop through them

        for (const spawn of spawns) {

            // Iterate if the spawn isn't spawning

            if (!spawn.spawning) continue

            // Otherwise display the role of the creep being spawn

            room.visual.text(Game.creeps[spawn.spawning.name].memory.role, spawn.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: constants.colors.lightBlue,
            })

            // And display how many ticks left until spawned

            room.visual.text(spawn.spawning.remainingTime.toString(), spawn.pos.x, spawn.pos.y - 1, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: constants.colors.lightBlue,
            })
        }
    }

    constructionTargetVisuals()

    function constructionTargetVisuals() {

        // If there is not a cSiteTargetID, stop

        if (!global[room.name].cSiteTargetID) return

        // Convert the construction target ID into a game object

        const constructionTarget = generalFuncs.findObjectWithID(global[room.name].cSiteTargetID)

        // If the constructionTarget exists, show visuals for it

        if (constructionTarget) room.visual.text('🚧', constructionTarget.pos)
    }

    function towerVisuals() {}
    function labVisuals() {}
    function factoryVisuals() {}
    function powerSpawnVisuals() {}
    function nukerVisuals() {}
    function observerVisuals() {}
    function sourceVisuals() {}
    function mineralVisuals() {}
}
