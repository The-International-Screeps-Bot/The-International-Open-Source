require("labFunctions")

module.exports = function labs(room) {

    let labs = room.get("labs")

    if (labs.length == 0) return

    let primaryLabs = room.get("primaryLabs")
    let secondaryLabs = room.get("secondaryLabs")
    let tertiaryLabs = room.get("tertiaryLabs")

    if (primaryLabs && primaryLabs.length > 0 && secondaryLabs) {
        if (secondaryLabs[0].cooldown == 0) {
            for (let secondaryLab of secondaryLabs) {

                secondaryLab.runReaction(primaryLabs[0], primaryLabs[1])

            }
        }
    }
}