require("labFunctions")

module.exports = function labs(room) {

    let labs = room.get("labs")

    // Stop if there are no labs

    if (labs.length == 0) return

    let primaryLabs = room.get("primaryLabs")
    let secondaryLabs = room.get("secondaryLabs")
    let tertiaryLabs = room.get("tertiaryLabs")

    runLabChemistry()

    function runLabChemistry() {

        // Stop if there aren't 2 primaryLabs

        if (primaryLabs.length != 2) return

        // Stop if there are no secondaryLabs

        if (secondaryLabs.length == 0) return

        // Stop a secondaryLab is on cooldown

        if (secondaryLabs[0].cooldown > 0) return

        // Loop through secondary labs

        for (let secondaryLab of secondaryLabs) {

            // Run reaction in lab using resources from primaryLabs 1 and 2

            secondaryLab.runReaction(primaryLabs[0], primaryLabs[1])

        }
    }
}