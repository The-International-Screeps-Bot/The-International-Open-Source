module.exports = function scientistManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    let labs = room.get("labs")

    if (labs.length == 0) return

    // Define variables needed

    let primaryLabs = room.get("primaryLabs")
    let secondaryLabs = room.get("secondaryLabs")
    let tertiaryLabs = room.get("tertiaryLabs")

    let storage = room.get("storage")
    let terminal = room.get("terminal")

    for (let creep of creepsWithRole) {

        const task = creep.memory.task

        // If creep has no task try to get one

        if (!task) creep.memory.task = findTask()

        function findTask() {

            for (let input1 in REACTIONS) {

                if (room.findStoredResourceAmount(input1) < 5000) continue

                for (let input2 in REACTIONS[input1]) {

                    if (room.findStoredResourceAmount(input2) < 5000) continue

                    let output = REACTIONS[input1][input2]
                    if (room.findStoredResourceAmount(output) >= 2000) continue

                    return {
                        input1: input1,
                        input2: input2,
                        output: output
                    }
                }
            }
        }

        // Make sure creep has a task

        if (!task) continue

        creep.isFull()

        // Check if creep should continue with this task

        if (!isTaskActive()) creep.memory.task = undefined

        function isTaskActive() {

            if (room.findStoredResourceAmount(task.input1) < creep.store.getCapacity()) return

            if (room.findStoredResourceAmount(task.input2) < creep.store.getCapacity()) return

            if (room.findStoredResourceAmount(task.output) >= 5000) return

            return true
        }

        // Make sure none of the labs have the wrong resources

        if (emptyPrimaryLab1()) continue

        function emptyPrimaryLab1() {

            // If creep is full

            if (creep.memory.isFull) {

                // Empty all resources to storing structures

                for (let resourceType in creep.store) {

                    creep.transferToStorageOrTerminal(resourceType)
                }
            }

            // Make sure lab only has input1

            if (primaryLabs[0].hasOnlyResource(task.input1)) return

            creep.withdrawAllResources(primaryLabs[0], [task.input1])
            return true
        }

        if (fillPrimaryLab1()) continue

        function fillPrimaryLab1() {

            // Stop if lab has more than half of creeps capacity

            if (primaryLabs[0].store.getUsedCapacity(input1) > creep.store.getCapacity() * 0.5) return

            // If creep has resources that aren't input1

            if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity() != creep.store.getUsedCapacity(input1)) {

                // Then put the other resources in storage

                for (let resourceType in creep.store) {

                    if (resourceType == input1) continue

                    creep.transferToStorageOrTerminal(resourceType)
                }
            }

            // If creep is not full

            if (!creep.memory.isFull) {

                // Get the resource from a storing structure

                creep.withdrawStoredResource(creep.store.getFreeCapacity(), creep.store.getFreeCapacity(), task.input1)
            }

            // Transfer correct resource to lab

            creep.advancedTransfer(primaryLabs[0], input1)
            return true
        }

        //

        /* if (isSecondaryLabsIncorrect()) continue

        function isSecondaryLabsIncorrect() {

            for (let lab of secondaryLabs) {

                if (!lab.hasOnlyResource(task.output)) {

                    creep.withdrawAllResources(lab, [task.output])
                    return true
                }
            }
        } */
    }
}