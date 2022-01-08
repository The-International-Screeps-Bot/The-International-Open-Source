import { constants } from "international/constants"

/**
 * Adds annotations to the room if roomVisuals are enabled
 */
export function roomVisualsManager(room: Room) {

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    controllerVisuals()

    function controllerVisuals() {

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

                if (constants.allyList.includes(room.controller.reservation.username)) {

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
}
