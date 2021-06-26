module.exports = {
    run: function(creep) {

        creep.isFull()

        creep.say("🚬")

        if (creep.memory.isFull) {

            let controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

            if (controllerLink != null) {

                creep.say("CL")

                creep.advancedTransfer(controllerLink, RESOURCE_ENERGY)
            }
        } else {

            let terminal = creep.room.terminal

            if (terminal && terminal.store[RESOURCE_ENERGY] >= 80000) {

                creep.say("T")

                creep.advancedWithdraw(terminal, RESOURCE_ENERGY)
            }
        }

        creep.avoidHostiles()
    }
};