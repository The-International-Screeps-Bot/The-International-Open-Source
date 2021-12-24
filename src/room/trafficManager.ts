export function trafficManager(room: Room) {

    const creepPositions = room.creepPositions
    const moveRequests = room.moveRequests

    for (const pos in moveRequests) {

        let i = 0

        for (let i = 0; i < moveRequests[pos].length; i++) {

            const creepAtPos = creepPositions[pos]

            // If there is a creep at the requested move pos

            if (creepAtPos.length > 0) {

                // If they are making a moveRequest

                if (creepAtPos.moveRequest) {

                    //

                    creepAtPos.runMoveRequest(pos)
                }
            }

            const creep = moveRequests[i]

            //

            creep.move(creep.pos.getDirectionTo(pos))
            break
        }
    }
}
