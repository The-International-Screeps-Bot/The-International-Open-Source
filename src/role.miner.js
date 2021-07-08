module.exports = {
    run: function(creep) {

        let mineral = creep.room.find(FIND_MINERALS)[0]

        let mineralContainer = Game.getObjectById(room.memory.mineralContainer)

        creep.isFull()

        if (creep.memory.isFull == false) {

            creep.say("⛏️");

            if (mineralContainer != null && creep.pos.getRangeTo(mineralContainer) != 0) {

                let goal = _.map([mineralContainer], function(target) {
                    return { pos: target.pos, range: 1 }
                })

                creep.intraRoomPathing(creep.pos, goal)

            } else {

                if (creep.harvest(mineral) == ERR_NOT_IN_RANGE) {

                    let goal = _.map([mineral], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)
                }
            }
        } else if (mineralContainer == null) {

            let terminal = creep.room.terminal
            let storage = creep.room.storage

            if (terminal && terminal.store.getUsedCapacity() < terminal.store.getCapacity()) {

                creep.say("T")

                creep.advancedTransfer(terminal, mineral.mineralType)

            } else if (storage && storage.store.getUsedCapacity() < storage.store.getCapacity()) {

                creep.say("S")

                creep.advancedTransfer(storage, mineral.mineralType)

            }
        }

        creep.avoidHostiles()
    }
};