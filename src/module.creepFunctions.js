Creep.prototype.wtihdrawMemory = function(target) {

    
}
Creep.prototype.withdrawResource = function(target) {

    
}
Creep.prototype.transferMemory = function(target) {


}
Creep.prototype.transferResource = function(target) {

    
}
Creep.prototype.controllerUpgrade = function(controller) {

    creep = this
    
    if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {

    creep.moveTo(controller, { reusePath: 50 })
    }
}
Creep.prototype.roadPathing = function(origin, goal) {
    
    creep = this

    var getawaypath = PathFinder.search(origin, goal, {
        plainCost: 2,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType === STRUCTURE_ROAD) {

                                            costs.set(struct.pos.x, struct.pos.y, 1)

                                        } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })


            return costs

        }
    }).path

    creep.memory.path = getawaypath

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.offRoadPathing = function(origin, goal) {
    
    creep = this

    var getawaypath = PathFinder.search(origin, goal, {
        plainCost: 2,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })


            return costs

        }
    }).path

    creep.memory.path = getawaypath

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}