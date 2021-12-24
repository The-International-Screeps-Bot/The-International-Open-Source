Creep.prototype.isDying = function() {

    const creep: Creep = this

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // Stop if creep body parts * 3 is more or less than ticks left alive

    if (creep.ticksToLive > creep.body.length * 3) return false

    // Record creep as dying

    creep.memory.dying = true
    return true
}

Creep.prototype.advancedTrafer = function(target: any, resource?: ResourceConstant, amount?: number) {

    const creep: Creep = this
    const room: Room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Travel to target and return that creep tried to move

        creep.travel({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            cacheAmount: 50,
        })
        return 'travel'
    }

    // If there wasn't a defined resource, define it as energy

    if (!resource) resource = 'energy'

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getUsedCapacity(resource), target.store.getFreeCapacity(resource))

    // Try to transfer

    const transferResult = creep.transfer(target, resource, amount)

    // If transfer is not a success

    if (transferResult != 0) {

        // Create visual and return transferResult

        room.actionVisual(creep.pos, target.pos, 'fail')
        return transferResult
    }

    // Create visual and return success

    room.actionVisual(creep.pos, target.pos)
    return 'success'
}

Creep.prototype.advancedWithdraw = function(target: any, resource?: ResourceConstant, amount?: number) {

    const creep: Creep = this
    const room: Room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Travel to target and return that creep tried to move

        creep.travel({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            cacheAmount: 50,
        })
        return 'travel'
    }

    // If there wasn't a defined resource, define it as energy

    if (!resource) resource = 'energy'

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getFreeCapacity(resource), target.store.getUsedCapacity(resource))

    // Try to withdraw

    const withdrawResult = creep.withdraw(target, resource, amount)

    // If withdraw is not a success

    if (withdrawResult != 0) {

        // Create visual and return withdrawResult

        room.actionVisual(creep.pos, target.pos, 'fail')
        return withdrawResult
    }

    // Create visual and return success

    room.actionVisual(creep.pos, target.pos)
    return 'success'
}

Creep.prototype.advancedHarvestSource = function(source: Source) {

    const creep: Creep = this

    const harvestResult: number = creep.harvest(source)
    if (harvestResult != 0) return harvestResult

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(creep.partsOfType(WORK) * 2, source.energy)
    Memory.energyHarvested += energyHarvested

    creep.say('⛏️' + energyHarvested)

    return 0
}

Creep.prototype.hasPartsOfTypes = function(partTypes: BodyPartConstant[]): boolean {

    const creep: Creep = this

    for (const partType of partTypes) {

        if (creep.body.some(part => part.type == partType)) return true
    }

    return false
}

Creep.prototype.partsOfType = function(type: BodyPartConstant) {

    const creep: Creep = this

    // Filter body parts that are of type, return number of them

    const partsOfType = creep.body.filter(part => part.type == type)
    return partsOfType.length
}

Creep.prototype.advancedMove = function() {

    const creep: Creep = this
    const room: Room = creep.room


}

interface TravelOpts {
    [key: string]: any
    plainCost: number,
    swampCost: number,
    avoidStages: [],
    flee: boolean,
    cacheAmount: number,
    avoidEnemyRanges: boolean,
}

Creep.prototype.travel = function(opts: TravelOpts) {

    const creep = this
    const room: Room = creep.room

    // Stop if creep can't move

    if (creep.fatigue > 0) return false

    // Stop if creep is spawning

    if (creep.spawning) return false

    // Assign defaults if values arn't provided

    const defaultValues: TravelOpts = {
        plainCost: 2,
        swampCost: 6,
        avoidStages: [],
        flee: false,
        cacheAmount: 20,
        avoidEnemyRanges: false,
    }

    for (const defaultName in defaultValues) {

        if (!opts[defaultName]) opts[defaultName] = defaultValues[defaultName]
    }

    const origin = opts.origin
    let goal = opts.goal

    // Stop if there is no inter room path to goal

    if (findInterRoomGoal() == ERR_NO_PATH) return ERR_NO_PATH

    function findInterRoomGoal() {

        // If we are in the room of the goal exit function

        if (origin.roomName == goal.pos.roomName) return false

        let route = creep.memory.route

        // Check if we need a new route. If so make one

        if (!route || route.length == 0) findNewRoute()

        function findNewRoute() {

            room.visual.text("New Route", creep.pos.x, creep.pos.y - 0.5, { color: '#AAF837' })

            const newRoute = Game.map.findRoute(origin.roomName, goal.pos.roomName, {
                routeCallback(roomName) {

                    if (roomName == goal.pos.roomName) return 1

                    if (!Memory.rooms[roomName] || !Memory.rooms[roomName].stage) return Infinity

                    /* if (!opts.avoidStages.includes(Memory.rooms[roomName].stage)) return 1 */

                    return Infinity
                }
            })

            route = newRoute
            creep.memory.route = route
        }

        // Make sure we can path to the goal's room

        if (route == ERR_NO_PATH) return ERR_NO_PATH

        // Make sure we have a valid route

        if (!route || route.length == 0) return false

        let goalRoom = route[0].room

        if (goalRoom == room.name) {

            route = route.slice(1)
            creep.memory.route = route
        }

        // Set new goal in the goalRoom

        goal = { pos: new RoomPosition(25, 25, goalRoom), range: 1 }
        return 0
    }

    let path = creep.memory.path
    const lastCache = creep.memory.lastCache
    const lastRoom = creep.memory.lastRoom

    findNewPath()

    function findNewPath() {

        if (!path || path.length == 0 || lastRoom != room.name || !lastCache || Game.time - lastCache >= opts.cacheAmount) {

            if (path && path.length == 1) {

                let lastPos = path[path.length - 1]
                lastPos = new RoomPosition(lastPos.x, lastPos.y, lastPos.roomName)

                let rangeFromGoal = lastPos.getRangeTo(goal.x, goal.y)
                if (rangeFromGoal == 0) return
            }

            room.visual.text("New Path", creep.pos.x, creep.pos.y + 0.5, { color: global.colors.yellow })

            let newPath = PathFinder.search(origin, goal, {
                plainCost: opts.plainCost,
                swampCost: opts.swampCost,
                maxRooms: 1,
                maxOps: 100000,
                flee: opts.flee,

                roomCallback: function(roomName) {

                    let room = Game.rooms[roomName]

                    if (!room) return false

                    let cm = new PathFinder.CostMatrix

                    // Prioritize roads if creep will benefit from them

                    if (opts.swampCost != 1) {

                        for (let road of room.get("road")) {

                            cm.set(road.pos.x, road.pos.y, 1)
                        }
                    }

                    // Find each exit pos and set to unwalkable if goal is in room

                    /* if (goal.pos.roomName == room.name) {

                        for (let x = 0; x < 50; x++) {

                            for (let y = 0; y < 50; y++) {

                                if (x <= 0 || x >= 49 || y <= 0 || y >= 49) cm.set(x, y, 255)
                            }
                        }
                    } */

                    // Set sorrounding area of enemyCreeps to unwalkable if position does not have a rampart

                    /* for (let enemy of room.get("enemyCreeps")) {

                        cm.set(enemy.pos.x, enemy.pos.y, 255)
                    } */

                    // Set unwalkable mySites as unwalkable

                    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => (s.structureType != STRUCTURE_RAMPART || (s.structureType == STRUCTURE_RAMPART && !s.my)) && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let site of mySites) {

                        cm.set(site.pos.x, site.pos.y, 255)
                    }

                    // Set unwalkable structures as unwalkable

                    let structures = room.find(FIND_STRUCTURES, {
                        filter: s => (s.structureType != STRUCTURE_RAMPART || (s.structureType == STRUCTURE_RAMPART && !s.my)) && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let structure of structures) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

                    // Set all creeps as unwalkable

                    /* let creep: Creep
                    for (creep of room.myCreeps) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    } */

                    // Set all power creeps as unwalkable

                    /* for (let creep of room.get("allPowerCreeps")) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    } */

                    return cm
                }
            }).path

            // Change path to newPath

            path = newPath
            creep.memory.path = path

            // Record room to track if we enter a new room

            creep.memory.lastRoom = room.name

            // Record time to find next time to path

            creep.memory.lastCache = Game.time
        }
    }

    function moveWithPath(): boolean | CreepMoveReturnCode {

        // Stop if there is no path

        if (!path || path.length == 0) return false

        let pos = path[0]

        // Move to first position of path

        let direction = creep.pos.getDirectionTo(room.newPos(pos))

        // Assign direction to creep

        creep.direction = direction

        // Try to move

        const moveResult = creep.move(direction)

        // If the move didn't work stop and inform the result

        if (moveResult != OK) return moveResult

        // Delete pos from path

        path = path.slice(1)

        // Assign path to memory

        creep.memory.path = path

        room.visual.poly(path, { stroke: global.colors.yellow, strokeWidth: .15, opacity: .2 })

        // If creep moved

        /* if (arePositionsEqual(creep.pos, pos)) {
            // Delete pos from path
            path = removePropertyFromArray(path, pos)
            // Assign path to memory
            creep.memory.path = path
        } */
        return true
    }

    // Stop if there is no path

    if (moveWithPath() == OK) return true

    return false
}

interface moveOpts {

}

Creep.prototype.advancedMove = function(opts: moveOpts) {

    const creep: Creep = this
    const room: Room = creep.room


}
