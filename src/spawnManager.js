let spawnRequests = require("spawnRequests")

module.exports = function spawnManager(room) {

    let spawns = room.get("spawns")

    // Stop if there are no spawns 

    if (spawns.length == 0) return

    // Find spawns that are not currently spawning

    let inactiveSpawns = []

    for (let spawn of spawns) {

        if (!spawn.spawning) inactiveSpawns.push(spawn)
    }

    // Stop if no spawns are not spawning

    if (inactiveSpawns.length == 0) return

    // Stop if there is less than 300 energy for spawning

    if (room.energyAvailable < 300) return

    // 

    let roomFixMessage = ""

    if (room.memory.roomFix) roomFixMessage = "rf"

    // Acquire values needed for spawning

    let { requiredCreeps, roleOpts } = spawnRequests(room, spawns)

    // Loop through requiredCreeps and try to spawn

    let i = 0

    for (let role in requiredCreeps) {

        // Iterate if there are no required creeps of role

        if (requiredCreeps[role] <= 0) continue

        // Exit if the designated spawn is spawning

        let spawn = inactiveSpawns[i]

        if (!spawn) break

        //

        let roleValues = roleOpts[role]

        // Stop if role has no spawning opts

        if (!roleValues) continue

        // Inform spawning that this is a test

        roleValues.opts.dryRun = true

        // See if creep can be spawned

        let testSpawn = spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.opts)

        // If test spawn worked

        if (testSpawn == 0) {

            // Inform opts that this is no longer a test

            roleValues.opts.dryRun = false

            // Spawn the creep

            spawn.spawnCreep(roleValues.body, (roomFixMessage + roleValues.role + ", T" + roleValues.tier + ", " + Game.time), roleValues.opts)

            // Record the cost of the creep

            Memory.data.energySpentOnCreeps += roleValues.cost

            // Record that an inactive spawn was used for future spawning this tick

            i++

            continue
        }

        // Error messages if test spawn failed

        switch (testSpawn) {
            case ERR_BUSY:

                console.log("Failed to spawn: " + roleValues.role + ", " + room.name + ", " + "all spawns are busy, " + roleValues.body)
                break
            case ERR_NOT_ENOUGH_ENERGY:

                console.log("Failed to spawn: " + roleValues.role + ", " + room.name + ", " + "not enough energy, " + room.energyAvailable + " / " + roleValues.cost + ", " + roleValues.body)
                break
            default:

                console.log("Failed to spawn: " + room.name + ", " + testSpawn + ", " + roleValues.role + ", " + roleValues.body.length + ", " + roleValues.tier + " " + JSON.stringify(roleValues.opts))
        }
    }
}