module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull == true) {

            let storage = creep.room.storage

            if (storage && storage.store[RESOURCE_ENERGY] <= 400000) {

                creep.say("S")

                creep.advancedTransfer(target)
            }
        } else {

            let terminal = creep.room.terminal

            if (terminal && terminal.store[RESOURCE_ENERGY] >= 150000) {

                creep.say("T")

                creep.advancedWithdraw(target)
            }
        }

        creep.avoidHostiles()
    }
};