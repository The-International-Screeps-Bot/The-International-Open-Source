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

            creep.say("FT")

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

        //

        let input1 = task.input1
        let input2 = task.input2
        let output = task.output

        // Check if creep should continue with this task

        if (!isTaskActive()) creep.memory.task = undefined

        function isTaskActive() {

            creep.say("NA")

            if (room.findStoredResourceAmount(input1) < creep.store.getCapacity()) return

            if (room.findStoredResourceAmount(input2) < creep.store.getCapacity()) return

            if (room.findStoredResourceAmount(output) >= 5000) return

            creep.say("IA")

            return true
        }

        // Operate primaryLab1

        if (emptyPrimaryLab1()) continue

        function emptyPrimaryLab1() {

            // Make sure lab only has input1

            if (primaryLabs[0].hasOnlyResource(input1)) return

            creep.say("OR")

            // If creep is full

            if (creep.memory.isFull) {

                creep.say("EC")

                // Empty all resources to storing structures

                for (let resourceType in creep.store) {

                    creep.transferToStorageOrTerminal(resourceType)
                    return true
                }
            }

            // Withdraw all resources besides input1

            creep.withdrawAllResources(primaryLabs[0], [input1])
            return true
        }

        if (fillPrimaryLab1()) continue

        function fillPrimaryLab1() {

            creep.say("LF")

            // Stop if lab has more than half of creeps capacity

            if (primaryLabs[0].store.getUsedCapacity(input1) > creep.store.getCapacity() * 0.5) return

            // If creep has resources that aren't input1

            if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity() != creep.store.getUsedCapacity(input1)) {

                creep.say("OR")

                // Then put the other resources in storage

                for (let resourceType in creep.store) {

                    if (resourceType == input1) continue

                    creep.transferToStorageOrTerminal(resourceType)
                    return true
                }
            }

            // If creep is not full

            if (!creep.memory.isFull) {

                creep.say("WR")

                // Get the resource from a storing structure

                creep.withdrawStoredResource(creep.store.getFreeCapacity(), creep.store.getFreeCapacity(), input1)
                return true
            }

            // Transfer correct resource to lab

            creep.say("TR")

            creep.advancedTransfer(primaryLabs[0], input1)
            return true
        }

        // Operate primaryLab2

        if (emptyPrimaryLab2()) continue

        function emptyPrimaryLab2() {

            // Make sure lab only has input2

            if (primaryLabs[1].hasOnlyResource(input2)) return

            creep.say("OR")

            // If creep is full

            if (creep.memory.isFull) {

                creep.say("EC")

                // Empty all resources to storing structures

                for (let resourceType in creep.store) {

                    creep.transferToStorageOrTerminal(resourceType)
                    return true
                }
            }

            // Withdraw all resources besides input2

            creep.withdrawAllResources(primaryLabs[1], [input2])
            return true
        }

        if (fillPrimaryLab2()) continue

        function fillPrimaryLab2() {

            creep.say("LF")

            // Stop if lab has more than half of creeps capacity

            if (primaryLabs[1].store.getUsedCapacity(input2) > creep.store.getCapacity() * 0.5) return

            // If creep has resources that aren't input2

            if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity() != creep.store.getUsedCapacity(input2)) {

                creep.say("OR")

                // Then put the other resources in storage

                for (let resourceType in creep.store) {

                    if (resourceType == input2) continue

                    creep.transferToStorageOrTerminal(resourceType)
                    return true
                }
            }

            // If creep is not full

            if (!creep.memory.isFull) {

                creep.say("WR")

                // Get the resource from a storing structure

                creep.withdrawStoredResource(creep.store.getFreeCapacity(), creep.store.getFreeCapacity(), input2)
                return true
            }

            // Transfer correct resource to lab

            creep.say("TR")

            creep.advancedTransfer(primaryLabs[1], input2)
            return true
        }

        // Operate secondaryLabs

        if (emptySecondaryLabs()) continue

        function emptySecondaryLabs() {

            // If creep is full

            if (creep.memory.isFull) {

                creep.say("EC")

                // Empty all resources to storing structures

                for (let resourceType in creep.store) {

                    creep.transferToStorageOrTerminal(resourceType)
                    return true
                }
            }

            for (let secondaryLab of secondaryLabs) {

                // If lab has resource besides output

                if (!secondaryLab.hasOnlyResource(output)) {

                    // Withdraw it

                    creep.withdrawAllResources(primaryLabs[1], [input2])
                    return true
                }

                if (secondaryLab.store.getUsedCapacity(output) >= creep.store.getFreeCapacity()) {

                    creep.advancedWithdraw(secondaryLab, output)
                    return true
                }
            }
        }

        if (creep.waitAwayFromAnchorPoint()) continue
    }
}