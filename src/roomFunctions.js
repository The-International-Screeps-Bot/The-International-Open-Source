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
Room.prototype.findTowerDamage = function(towers, pos) {

    let totalDamage = 0

    for (let tower of towers) {

        let range = tower.pos.getRangeTo(pos)

        if (range <= TOWER_OPTIMAL_RANGE) {

            totalDamage += TOWER_POWER_ATTACK
            continue
        }

        const factor = (range < TOWER_FALLOFF_RANGE) ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE) : 1
        totalDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor));
    }

    creep.room.visual.text(totalDamage, pos.x, pos.y + 0.25, { align: 'center', color: Memory.global.colors.communeBlue, font: "0.7" })

    return totalDamage
}