let spawnVariables = require("spawnVariables")
let spawnRequests = require("spawnRequests")

function spawnManager(room, spawns, specialStructures) {

    // Confirm there are spawns able to spawn creeps

    let inactiveSpawns = []

    for (let spawn of spawns) {

        if (!spawn.spawning) inactiveSpawns.push(spawn)
    }

    if (inactiveSpawns.length == 0) return

    if (room.energyAvailable < 300) return

    let roomFixMessage = ""

    if (room.memory.roomFix) roomFixMessage = "rf"

    // Return values needed for spawning

    let { roleOpts } = spawnVariables(room, spawns, specialStructures)

    let { requiredCreeps } = spawnRequests(room, spawns, specialStructures)

    // Loop through requiredCreeps and try to spawn

    let i = 0

    for (let role in requiredCreeps) {

        /* console.log("AMOUNT: " + requiredCreeps[role] + ", ROLE: " + role) */

        if (requiredCreeps[role] <= 0) continue

        let spawn = inactiveSpawns[i]

        if (!spawn) break

        let roleValues = roleOpts[role]

        if (!roleValues) continue

        roleValues.opts["dryRun"] = true

        let testSpawn = spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.opts)

        if (testSpawn == 0) {

            roleValues.opts["dryRun"] = false

            spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.opts)

            Memory.data.energySpentOnCreeps += roleValues.cost

        } else {

            switch (testSpawn) {
                case ERR_BUSY:

                    console.log("Failed to spawn: " + roleValues.role + ", " + room.name + ", " + "all spawns are busy " + roleValues.body)
                    break
                case ERR_NOT_ENOUGH_ENERGY:

                    console.log("Failed to spawn: " + roleValues.role + ", " + room.name + ", " + "not enough energy " + roleValues.body)
                    break
                default:

                    console.log("Failed to spawn: " + room.name + ", " + testSpawn + ", " + roleValues.role + ", " + roleValues.body.length + ", " + roleValues.tier + " " + JSON.stringify(roleValues.opts))
            }
        }

        i++
    }
}

module.exports = spawnManager
module.exports = spawnManager