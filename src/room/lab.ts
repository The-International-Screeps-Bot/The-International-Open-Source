Room.prototype.labManager = function () {

    //const factory = this.structures.factory[0]
    const room = this

    if(room.name == "W21N8") {
        const input1 = _.find(room.structures.lab, lab => lab.id == "6300bba6fa5d294c1e1763a1");
        const input2 = _.find(room.structures.lab, lab => lab.id == "6300838274ce72369e571442");
        const outputs = _.filter(room.structures.lab, lab => lab != input1 && lab != input2);

        for (const output of outputs) {
            if(output.cooldown) continue;
            output.runReaction(input1, input2);
        }
    }

    //room.MOFTT
    //if(this.MOFTT)
}
