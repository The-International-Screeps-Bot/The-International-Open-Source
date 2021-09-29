global.avgPrice = function(resource) {

    let resourceHistory = Game.market.getHistory(resource)
    if (Object.values(resourceHistory).length == 0) return 0

    return resourceHistory[0].avgPrice
}

global.findOrders = function(orderType, resourceType) {

    let orders = Game.market.getAllOrders({ type: orderType, resourceType: resourceType })

    return orders
}

global.findObjectWithId = function(id) {

    if (!id || Game.getObjectById(id) == null) return false

    return Game.getObjectById(id)
}

global.removePropertyFromArray = function(array, property) {

    let i = 0

    while (i < array.length) {

        if (array[i] == property) return array.slice(i + 1)

        i++
    }

    return array
}

global.findBestNewCommune = function() {

    let establishingInfo = []

    for (let potentialNewCommune of Memory.global.claimableRooms) {
        for (let stage = 8; stage > 3; stage--) {
            for (let maxDistance = 0; maxDistance < 10; maxDistance++) {
                for (let roomName of Memory.global.communes) {

                    let room = Game.rooms[roomName]

                    if (!room || !room.controller || stage != room.memory.stage) continue

                    const anchorPoint = room.get("anchorPoint")

                    let distance = room.findSafeDistance(anchorPoint, { pos: new RoomPosition(25, 25, potentialNewCommune), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"])
                    if (distance != maxDistance) continue

                    console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                    establishingInfo.push({ communeEstablisher: room.name, newCommune: potentialNewCommune, distance: distance })
                }
            }
        }
    }

    var bestEstablishingInfo = establishingInfo.reduce(function(bestEstablishingInfo, info) {

        return info.distance < bestEstablishingInfo.distance ? info : bestEstablishingInfo;
    }, establishingInfo[0])

    return bestEstablishingInfo
}

global.findRobbingRoom = function() {

    if (Memory.global.robTarget && Memory.global.robbingRoom) return



    for (let stage = 8; stage > 3; stage--) {
        for (let maxDistance = 0; maxDistance < 10; maxDistance++) {
            for (let roomName of Memory.global.communes) {

                let room = Game.rooms[roomName]

                if (!room || !room.controller || stage != room.memory.stage || !room.get("storage")) continue

                const anchorPoint = room.get("anchorPoint")

                let distance = room.findSafeDistance(anchorPoint, { pos: new RoomPosition(25, 25, Memory.global.robTarget), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"])
                if (distance != maxDistance) continue

                console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                Memory.global.robbingRoom = room.name

                return "Found robbing room: " + room.name
            }
        }
    }
}

global.getPositionsInsideRect = function(rect) {

    let positions = []

    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {

            positions.push({ x: x, y: y })
        }
    }

    return positions
}