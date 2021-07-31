let creepOpts = require("creepOpts")
let spawnRequests = require("spawnRequests")

function spawnManager(room, spawns) {

    // Confirm there are spawns able to spawn creeps

    let spawningSpawns = 0

    for (let spawn of spawns) {

        if (spawn.spawning) spawningSpawns++
    }

    if (spawningSpawns == spawns.length) return

    let roomFixMessage = ""

    if (room.memory.roomFix) roomFixMessage = "rf"

    // Return values needed for spawning

    let { roleOpts } = creepOpts(room)
    let { requiredCreeps } = spawnRequests(room)

    // Loop through requiredCreeps and try to spawn

    let i = 0

    for (let role of Object.keys(requiredCreeps)) {

        let spawn = spawns[i]

        if (spawn) {

            let roleValues = roleOpts[role]

            if (roleValues.role == role && room.energyCapacityAvailable >= 300) {

                let testSpawn = spawn.spawnCreep(roleValues.body, roleValues.role, { dryRun: true })

                if (testSpawn == 0) {

                    spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.memory)

                    requiredCreeps[role] - 1

                    Memory.data.energySpentOnCreeps += roleValues.cost

                    i++

                } else if (testSpawn != -4) {

                    console.log("Failed to spawn: " + testSpawn + ", " + roleValues.role + ", " + roleValues.body.length + ", " + roleValues.tier + " " + JSON.stringify(roleValues.memory))
                }
            }
        }
    }
}

module.exports = spawnManager