var roleUpgrader = require('role.upgrader')

function builderManager(room, creepsWithRole) {

    if (!room.get("controller").my) return

    const anchorPoint = room.get("anchorPoint")

    function findBuildableSites(mySites) {

        let cm = new PathFinder.CostMatrix

        let myCreeps = room.find(FIND_MY_CREEPS)

        for (let creep of myCreeps) {

            cm.set(creep.pos.x, creep.pos.y, 255)
        }

        let buildableSites = []

        for (let site of mySites) {

            if (site.structureType == STRUCTURE_CONTAINER || site.structureType == STRUCTURE_ROAD || site.structureType == STRUCTURE_RAMPART) buildableSites.push(site)

            if (cm.get(site.pos.x, site.pos.y) == 255) continue

            buildableSites.push(site)
        }

        return buildableSites
    }

    let mySites = findBuildableSites(room.find(FIND_MY_CONSTRUCTION_SITES))

    if (mySites.length == 0) {

        for (let creep of creepsWithRole) {

            roleUpgrader.run(creep)
            return
        }
    }

    let targetSite = findObjectWithId(room.memory.targetSite)

    if (!targetSite || !mySites.includes(targetSite)) {

        if (creepsWithRole.length == 1) {

            targetSite = creepsWithRole[0].pos.findClosestByRange(mySites)
            room.memory.targetSite = targetSite.id

        } else {

            targetSite = room.memory.targetSite = anchorPoint.findClosestByRange(mySites)
            room.memory.targetSite = targetSite.id
        }
    }

    if (!targetSite) return

    room.visual.text("🚧", targetSite.pos.x, targetSite.pos.y + 0.25, { align: 'center' })

    for (let creep of creepsWithRole) {

        if (creep.avoidHostiles()) continue

        creep.isFull()
        const isFull = creep.memory.isFull

        if (isFull) {

            creep.say("🚧")

            creep.buildSite(targetSite)

        } else {

            let storage = room.get("storage")
            let terminal = room.get("terminal")

            if (storage || terminal) {

                console.log(creep.withdrawStoredResource(20000))
            } else {

                let container = creep.searchSourceContainers()

                if (container) {

                    creep.say("SC")

                    creep.advancedWithdraw(container)

                } else {

                    let droppedEnergy = creep.findDroppedEnergyOfAmount(creep.store.getFreeCapacity())

                    if (droppedEnergy) {

                        creep.say("💡")

                        creep.pickupDroppedEnergy(droppedEnergy)
                    }
                }
            }
        }
    }
}

module.exports = builderManager