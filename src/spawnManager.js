let creepOpts = require("creepOpts")
let spawnRequests = require("spawnRequests")

function spawnManager(room, spawns) {

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

    let { roleOpts } = creepOpts(room)
    let { requiredCreeps } = spawnRequests(room)

    // Loop through requiredCreeps and try to spawn

    let i = 0

    for (let role in requiredCreeps) {

        console.log("ROLE" + role)

        if (requiredCreeps[role] == 0) continue

        let spawn = inactiveSpawns[i]

        if (!spawn) break

        let roleValues = roleOpts[role]

        if (roleValues.role != role) break

        let testSpawn = spawn.spawnCreep(roleValues.body, roleValues.role, { dryRun: true })

        if (testSpawn == 0) {

            spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.memory)

            requiredCreeps[role] - 1

            Memory.data.energySpentOnCreeps += roleValues.cost

        } else if (testSpawn != ERR_BUSY) {

            console.log("Failed to spawn: " + testSpawn + ", " + roleValues.role + ", " + roleValues.body.length + ", " + roleValues.tier + " " + JSON.stringify(roleValues.memory))
        }

        i++
    }
}

module.exports = spawnManager