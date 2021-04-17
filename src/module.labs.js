module.exports = {
    run: function labs() {
        _.forEach(Game.rooms, function(room) {
            if (room && room.controller && room.controller.my && room.controller.level >= 7) {

                let rawPrimaryLabs = room.memory.primaryLabs
                let rawSecondaryLabs = room.memory.secondaryLabs

                let primaryLabs = []
                let secondaryLabs = []

                for (let labs of rawPrimaryLabs) {

                    let lab = Game.getObjectById(labs)
                    primaryLabs.push(lab)

                }
                for (let labs of rawSecondaryLabs) {

                    let lab = Game.getObjectById(labs)
                    secondaryLabs.push(lab)

                }

                if (secondaryLabs[0] && primaryLabs[0] && secondaryLabs[0].cooldown == 0 && _.sum(primaryLabs[0].store) > 0 && _.sum(primaryLabs[1].store) > 0) {
                    for (let secondaryLab of secondaryLabs) {

                        secondaryLab.runReaction(primaryLabs[0], primaryLabs[1])

                    }
                }
            }
        })
    }
};