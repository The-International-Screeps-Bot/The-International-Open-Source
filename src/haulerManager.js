function haulerManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    class WithdrawOrder {
        constructor(task, condition) {

            this.task = task
            this.condition = condition
        }
    }

    for (let creep of creepsWithRole) {

        const task = creep.memory.task
    }
}

module.exports = haulerManager