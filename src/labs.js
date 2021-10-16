require("labFunctions")

module.exports = function labs(room, labs, primaryLabs, secondaryLabs, tertiaryLabs) {

    if (labs.length == 0) return


    if (primaryLabs && primaryLabs.length > 0 && secondaryLabs) {
        if (secondaryLabs[0].cooldown == 0) {
            for (let secondaryLab of secondaryLabs) {

                secondaryLab.runReaction(primaryLabs[0], primaryLabs[1])

            }
        }
    }
}