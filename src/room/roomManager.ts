import "./creeps/taskManager"

import "./creeps/creepManager"

import "./structures/spawnManager"

export function roomManager() {

    for (let roomName in Game.rooms) {

        const room = Game.rooms[roomName]

        const controller = room.get("controller")

        // Iterate if there is no controller or we don't own the controller

        if (!controller || !controller.my) continue

        //


    }
}
