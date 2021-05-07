module.exports = {
    run: function(creep) {

        if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

            const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

            if (route.length > 0) {

                creep.say(creep.memory.roomFrom)

                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        }

        var terminal = creep.room.terminal

        let rawPrimaryLabs = creep.room.memory.primaryLabs
        let rawSecondaryLabs = creep.room.memory.secondaryLabs

        let primaryLab = []
        let secondaryLab = []

        for (let labs of rawPrimaryLabs) {

            let lab = Game.getObjectById(labs)
            primaryLab.push(lab)

        }
        for (let labs of rawSecondaryLabs) {

            let lab = Game.getObjectById(labs)
            secondaryLab.push(lab)

        }

        let t3Boosts = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
        let t2Boosts = ["UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2"]
        let t1Boosts = ["UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO"]
        let bases = ["OH", "ZK", "UL", "G"]
        let minerals = ["H", "O", "U", "K", "L", "Z", "X"]

        let reactions = {
            bases: {
                "OH": { reactant1: "", reactant2: "" },
            },
            t1Boosts: {

            },
            t2Boosts: {

            },
            t3Boosts: {

            }
        }

        //if tertairyLabs exist and they don't have 2000 boost in each, when current task is done fill the labs

        // for each resource in reactions if number of resource is below x, creep.memory.resource is resource

        // until resource is x * 1.5 make sure primaryLabs have reactants 1 and 2, and secondaryLabs have resource

        //if secondaryLabs have 500+ resource, withdraw and deposit in terminal, or if past 200k storage deposit in storage if below 900k

        let labProductionAmount = 20000
        let labProductionType = undefined

        if (labProductionAmount == undefined) {

            labProductionAmount = 0

        }
        if (labProductionType == undefined) {

            labProductionType = RESOURCE_HYDROXIDE

        }

        if (terminal.store.getUsedCapacity([RESOURCE_HYDROXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_HYDROXIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_ZYNTHIUM_KEANITE]) < labProductionAmount) {

            labProductionType = RESOURCE_ZYNTHIUM_KEANITE

        } else if (terminal.store.getUsedCapacity([RESOURCE_UTRIUM_LEMERGITE]) < labProductionAmount) {

            labProductionType = RESOURCE_UTRIUM_LEMERGITE

        } else if (terminal.store.getUsedCapacity([RESOURCE_GHODIUM]) < labProductionAmount) {

            labProductionType = RESOURCE_GHODIUM

        } else if (terminal.store.getUsedCapacity([RESOURCE_UTRIUM_HYDRIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_UTRIUM_HYDRIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_UTRIUM_OXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_UTRIUM_OXIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_KEANIUM_HYDRIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_KEANIUM_HYDRIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_KEANIUM_OXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_KEANIUM_OXIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_LEMERGIUM_HYDRIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_LEMERGIUM_HYDRIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_LEMERGIUM_OXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_LEMERGIUM_OXIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_ZYNTHIUM_HYDRIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_ZYNTHIUM_HYDRIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_ZYNTHIUM_OXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_ZYNTHIUM_OXIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_GHODIUM_HYDRIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_GHODIUM_HYDRIDE

        } else if (terminal.store.getUsedCapacity([RESOURCE_GHODIUM_OXIDE]) < labProductionAmount) {

            labProductionType = RESOURCE_GHODIUM_OXIDE

        }

        creep.memory.resource = labProductionType
        creep.memory.resourceAmount = labProductionAmount

        /*
        for (let resources of t3Boosts) {

            if (labProductionType == resources) {

                labProductionAmount = 5000 - terminal.store.getUsedCapacity([resources])

            }
        }
        for (let resources of t2Boosts) {

            if (labProductionType == resources) {

                labProductionAmount = 3000 - terminal.store.getUsedCapacity([resources])

            }
        }
        for (let resources of t1Boosts) {

            if (labProductionType == resources) {

                labProductionAmount = 2000 - terminal.store.getUsedCapacity([resources])

            }
        }
        for (let resources of bases) {

            if (labProductionType == resources) {

                labProductionAmount = 5000 - terminal.store.getUsedCapacity([resources])

            }
        }
        for (let resources of minerals) {

            if (labProductionType == resources) {

                labProductionAmount = 5000 - terminal.store.getUsedCapacity([resources])
                console.log(labProductionAmount = 5000 - terminal.store.getUsedCapacity([resources]) + creep.room)

            }
        }
        */
        //console.log(labProductionAmount = 5000 - terminal.store.getUsedCapacity([RESOURCE_UTRIUM_LEMERGITE]) + creep.room)

        let primaryResource = 0
        let secondaryResource = 0
        let outputResource = 0

        if (primaryLab[0] && primaryLab[1]) {

            if (labProductionAmount > 0 && labProductionType) {

                if (labProductionType == RESOURCE_HYDROXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_OXYGEN
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_HYDROXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_ZYNTHIUM_KEANITE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_ZYNTHIUM
                    secondaryResource = RESOURCE_KEANIUM
                    outputResource = RESOURCE_ZYNTHIUM_KEANITE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_UTRIUM_LEMERGITE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_UTRIUM
                    secondaryResource = RESOURCE_LEMERGIUM
                    outputResource = RESOURCE_UTRIUM_LEMERGITE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_GHODIUM) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_ZYNTHIUM_KEANITE
                    secondaryResource = RESOURCE_UTRIUM_LEMERGITE
                    outputResource = RESOURCE_GHODIUM

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity([primaryResource]) + creep.store.getUsedCapacity([secondaryResource])) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_UTRIUM_HYDRIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_UTRIUM
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_UTRIUM_HYDRIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity([primaryResource]) + creep.store.getUsedCapacity([secondaryResource])) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_UTRIUM_OXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_UTRIUM
                    secondaryResource = RESOURCE_OXYGEN
                    outputResource = RESOURCE_UTRIUM_OXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity([primaryResource]) + creep.store.getUsedCapacity([secondaryResource])) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_KEANIUM_HYDRIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_KEANIUM
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_KEANIUM_HYDRIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity([primaryResource]) + creep.store.getUsedCapacity([secondaryResource])) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_KEANIUM_OXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_KEANIUM
                    secondaryResource = RESOURCE_OXYGEN
                    outputResource = RESOURCE_KEANIUM_OXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > creep.store.getUsedCapacity([primaryResource]) + creep.store.getUsedCapacity([secondaryResource])) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_LEMERGIUM_HYDRIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_LEMERGIUM
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_LEMERGIUM_HYDRIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_LEMERGIUM_OXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_LEMERGIUM
                    secondaryResource = RESOURCE_OXYGEN
                    outputResource = RESOURCE_LEMERGIUM_OXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_ZYNTHIUM_HYDRIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_ZYNTHIUM
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_ZYNTHIUM_HYDRIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_ZYNTHIUM_OXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_ZYNTHIUM
                    secondaryResource = RESOURCE_OXYGEN
                    outputResource = RESOURCE_ZYNTHIUM_OXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_GHODIUM_HYDRIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_GHODIUM
                    secondaryResource = RESOURCE_HYDROGEN
                    outputResource = RESOURCE_GHODIUM_HYDRIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                } else if (labProductionType == RESOURCE_GHODIUM_OXIDE) {

                    creep.say(_.sum(primaryLab[0].store) + ", " + labProductionType)

                    primaryResource = RESOURCE_GHODIUM
                    secondaryResource = RESOURCE_OXYGEN
                    outputResource = RESOURCE_GHODIUM_OXIDE

                    for (let lab of primaryLab) {
                        //if lab has resources that aren't primary or secondary
                        if (_.sum(lab.store) > lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F1")
                            creep.memory.target = "PL"

                            if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                creep.say("PL WR")

                                if (creep.pos.isNearTo(lab)) {

                                    for (let resources in lab.store) {

                                        creep.withdraw(lab, resources)

                                    }
                                } else {

                                    creep.moveTo(lab, { reusePath: 50 })

                                }
                            } else {

                                creep.say("PL F")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                        //if lab needs primary or secondary resources
                        if (_.sum(lab.store) <= 250 && creep.store.getUsedCapacity() == creep.store[primaryResource] + creep.store[secondaryResource] && _.sum(lab.store) == lab.store[primaryResource] + lab.store[secondaryResource]) {

                            creep.say("F2")
                            creep.memory.target = "PL"

                            if (lab == primaryLab[0]) {

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL PR")

                                    if (creep.withdraw(terminal, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, primaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            } else if (lab == primaryLab[1]) {
                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("PL SR")

                                    if (creep.withdraw(terminal, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                } else {

                                    if (creep.transfer(lab, secondaryResource) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                }
                            }
                        } else {

                            creep.memory.target = false

                        }
                    }
                    if (creep.memory.target != "PL") {
                        for (let lab of secondaryLab) {
                            //if lab has more than 250 resources
                            if (_.sum(lab.store) > lab.store[outputResource]) {

                                creep.say("F3")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL WR")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL F")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (_.sum(lab.store) >= 250) {

                                creep.say("F4")
                                creep.memory.target = "SL"

                                if (creep.store.getUsedCapacity() < creep.store.getCapacity()) {

                                    creep.say("SL O")

                                    if (creep.pos.isNearTo(lab)) {

                                        for (let resources in lab.store) {

                                            creep.withdraw(lab, resources)

                                        }
                                    } else {

                                        creep.moveTo(lab, { reusePath: 50 })

                                    }
                                } else {

                                    creep.say("SL T")

                                    if (creep.pos.isNearTo(terminal)) {

                                        for (let resources in creep.store) {

                                            creep.transfer(terminal, resources)

                                        }
                                    } else {

                                        creep.moveTo(terminal, { reusePath: 50 })

                                    }
                                }
                            } else if (creep.store.getUsedCapacity() > 0 && creep.store.getUsedCapacity([primaryResource]) == 0 && creep.store.getUsedCapacity([secondaryResource]) == 0) {

                                creep.say("SL E")

                                if (creep.pos.isNearTo(terminal)) {

                                    for (let resources in creep.store) {

                                        creep.transfer(terminal, resources)

                                    }
                                } else {

                                    creep.moveTo(terminal, { reusePath: 50 })

                                }
                            }
                        }
                    } else if (creep.memory.target == false) {

                        creep.say("T")
                        creep.moveTo(terminal, { reusePath: 50 })

                        if (creep.pos.isNearTo(terminal) && creep.store.getUsedCapacity() > 0) {

                            for (let resources in creep.store) {

                                creep.transfer(terminal, resources)

                            }
                        }
                    }
                }
            }
        }
    }
};