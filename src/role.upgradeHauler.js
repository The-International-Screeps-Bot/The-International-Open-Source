module.exports = {
    run: function(creep) {

        creep.isFull()

        creep.say("🚬")

        if (creep.memory.isFull) {

            let controllerLink = findObjectWithId(creep.room.memory.controllerLink)

            if (controllerLink) {

                creep.say("CL")

                creep.advancedTransfer(controllerLink)

            } else if (creep.room.get("controllerContainer")) {

                creep.say("CC")

                creep.advancedTransfer(creep.room.get("controllerContainer"))
            }
        } else {

            let terminal = creep.room.terminal

            if (terminal && terminal.store[RESOURCE_ENERGY] >= 70000) {

                creep.say("T")

                creep.advancedWithdraw(terminal)
            }
        }

        creep.avoidHostiles()
    }
};