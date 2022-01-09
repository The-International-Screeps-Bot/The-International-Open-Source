/**
 * author: EngineerYo (Will#7386 on Discord). Contact me if you have issues
 *
 * @param {Array.<RoomPosition>} seed An array of RoomPositions to serve as generation 0
 * @returns {PathFinder.CostMatrix} A CostMatrix created according to your scoring function
*/
function floodFill(seed) {
    // thisGeneration is an array of objects that follow the form {pos: RoomPosition, from: RoomPosition}, but generation 0 doesn't have a `from`
    let thisGeneration = []
    seed.forEach(position => thisGeneration.push({pos: position, from: null}))

    let visited = seed.map(s => s.serialize()) // whatever serializing function you have. just turns a RoomPosition into a string for easy lookup
    let outCostMatrix = new PathFinder.CostMatrix

    let depth = 0
    while (thisGeneration.length) {
        let nextGeneration = []

        for (let targetPosition of thisGeneration) {
              // Update the CostMatrix for this position
			  let score = depth // doesn't have to be depth. use any score you want
              outCostMatrix.set(targetPosition.x, targetPosition.y, score)

              // Now populate `nextGeneration`
              let adjacentPositions = targetPosition.getAdjacent() // whatever function you have for getting adjacent positions. mine typically doesn't return terrain walls
              for (let adjacent of adjacentPositions) {
                // Have we already seen this adjacent position? If not, mark it as seen
                if (visited.includes(adjacent.serialize())) continue
                visited.push(adjacent.serialize())

                // Otherwise, add it to `nextGeneration`
                nextGeneration.push({
                      pos:   adjacent,
                      from:  targetPosition
                })
            }
        }

        // Now that we've iterated through all of `thisGeneration`, set `thisGeneration` to `nextGeneration`
        // If we found no valid positions in `thisGeneration`, it'll have length 0 and end our loop
        thisGeneration = nextGeneration
        depth += 1
	}

    return outCostMatrix
}

// Sample serializing function. Could be any unique mapping from RoomPosition to String you'd like, though
RoomPosition.serialize = function(pos) {
	let {x, y, roomName} = pos

	if (x < 10) x = `0${x}`
	if (y < 10) y = `0${y}`

	return `${x}${y}${roomName}`
}

// Sample adjacent function. Note that this ignores terrain walls
RoomPosition.prototype.getAdjacent = function() {
	let targetRoom = Game.rooms[this.roomName]

	// This just maps directions (1 thru 8) to x & y offsets
	const DIRECTIONS = {
		1: [ 0, -1],
		2: [ 1, -1],
		3: [ 1,  0],
		4: [ 1,  1],
		5: [ 0,  1],
		6: [-1,  1],
		7: [-1,  0],
		8: [-1, -1]
	}

	let terrain = targetRoom.getTerrain()
	let outArr = []

	for (let i in DIRECTIONS) {
		let [dx, dy] = DIRECTIONS[i]

		let terr = terrain.get(this.x+dx, this.y+dy)
		if (terr !== TERRAIN_MASK_WALL) {
			let newPosition = targetRoom.getPositionAt(this.x+dx, this.y+dy)
			outArr.push(newPosition)
		}
	}

    return outArr
}
