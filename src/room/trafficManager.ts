export function trafficManager(room: Room) {

    const moveRequests = room.moveRequests

    for (const requestPos in moveRequests) {

        const creepName = moveRequests[requestPos]

        const creep = Game.creeps[creepName]


    }
}
