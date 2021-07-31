let roleOpts = require("creepOpts")
let requiredCreeps = require("spawnRequests")

function spawnManager(spawns) {

    let i = 0

    for (let role in requiredCreeps) {

        let spawn = spawns[i]

        i++

        if (spawn) {

            let roleValues = roleOpts[role]

            if (roleValues.role == role && freeEnergy >= 300) {

                let testSpawn = spawn.spawnCreep(roleValues.body, roleValues.role, { dryRun: true })

                if (testSpawn == 0) {

                    spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.memory)

                    requiredCreeps[role] - 1

                    Memory.data.energySpentOnCreeps += roleValues.cost

                } else if (testSpawn != -4) {

                    console.log("Failed to spawn: " + testSpawn + ", " + roleValues.role + ", " + roleValues.body.length + ", " + roleValues.tier + " " + JSON.stringify(roleValues.memory))
                }
            }
        }
    }
}

module.exports = spawnManager