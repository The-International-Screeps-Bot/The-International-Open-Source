module.exports = function antifaAssaulterManager(room, assaulters) {

    for (let creep of assaulters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom
        const attackTarget = Memory.global.attackTarget

        const type = creep.memory.type
        const size = creep.memory.size
        const amount = creep.memory.amount
        const requiredAmount = creep.memory.requiredAmount
        const part = creep.memory.part

        const supporter = Game.creeps[creep.memory.supporter]
        const secondAssaulter = Game.creeps[creep.memory.secondAssaulter]
        const secondSupporter = Game.creeps[creep.memory.secondSupporter]

        const members = [creep, supporter, secondAssaulter, secondSupporter]
        const membersObject = {
            creep: creep,
            supporter: supporter,
            secondAssaulter: secondAssaulter,
            secondSupporter: secondSupporter
        }

        creep.findMemberCount(members)

        // If not in a full squad

        if (!creep.isSquadFull()) {

            newSquad()

            function newSquad() {

                if (room.name != roomFrom) {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }

                const anchorPoint = room.get("anchorPoint")

                if (creep.pos.getRangeTo(anchorPoint) != 7) {

                    creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                    if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: anchorPoint, range: 7 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })

                        return
                    }

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: anchorPoint, range: 7 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: true,
                        cacheAmount: 10,
                    })

                    return
                }
            }

            creep.say("🚬")

            createQuad()

            function createQuad() {

                // Make sure creep wants to be a quad

                if (size != "quad") return

                // Make sure creep is at least in a duo

                if (!supporter) return

                // If creep is not next to supporter get next to supporter

                if (creep.pos.getRangeTo(supporter) > 1) {

                    supporter.travel({
                        origin: supporter.pos,
                        goal: { pos: creep.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })

                    return
                }

                creep.findDuo(assaulters)
            }

            continue
        }

        if (part != "front") continue

        creep.say("F")

        // State machine for room

        if (room.name == attackTarget) {

            inAttackTarget()
            continue
        }

        if (room.name == roomFrom) {

            inRoomFrom()
            continue
        }

        inOtherRoom()
        continue


        function inAttackTarget() {

            // Squad is in attackTarget

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            // check if quad is in formation. If not enter attackMode

            creep.quadEnterAttackMode(membersObject)
        }

        function inRoomFrom() {

            // Squad is in roomFrom

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            creep.squadTravel(
                members, supporter, secondAssaulter, secondSupporter, {
                    pos: new RoomPosition(25, 25, attackTarget),
                    range: 1
                })
        }

        function inOtherRoom() {

            // Squad is travelling to attackTarget

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            creep.squadTravel(
                members, supporter, secondAssaulter, secondSupporter, {
                    pos: new RoomPosition(25, 25, attackTarget),
                    range: 1
                })
        }
    }
}