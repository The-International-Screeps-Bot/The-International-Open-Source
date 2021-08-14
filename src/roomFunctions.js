let { structures } = require("roomVariables")

Room.prototype.getObjectWithId = function(id) {

    if (Game.getObjectById(id) == null) return false

    return Game.getObjectById(id)
}
Room.prototype.findExitRooms = function(roomName) {

    let exits = Game.map.describeExits(roomName)
    let exitRoomNames = []

    for (let property in exits) {

        exitRoomNames.push(exits[property])
    }

    return exitRoomNames
}
Room.prototype.storedEnergy = function(room) {

    let storedEnergy = 0

    if (structures.storage) storedEnergy += structures.storage.store[RESOURCE_ENERGY]

    if (structures.terminal) storedEnergy += structures.terminal.store[RESOURCE_ENERGY]

    return storedEnergy
}
Room.prototype.findSafeDistance = function(origin, goal, avoidStages) {

    let route = Game.map.findRoute(origin.roomName, goal.pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal.pos.roomName) {

                return 1
            }
            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                return 1
            }

            return Infinity
        }
    })

    return route.length
}