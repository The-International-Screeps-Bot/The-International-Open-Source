import { creepClasses } from 'room/creeps/creepClasses'
import { myColors, spawnByRoomRemoteRoles } from './constants'
import { customLog, pack } from './generalFunctions'
import { InternationalManager } from './internationalManager'

InternationalManager.prototype.creepOrganizer = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Construct counter for creeps

    let totalCreepCount = 0

    function processSingleCreep(creepName: string) {
        let creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {
            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            return
        }

        // Increase total creep counter

        totalCreepCount += 1

        // Get the creep's role

        const { role } = creep
        if (!role || role.startsWith('shard')) return

        // Assign creep a class based on role

        const creepClass = creepClasses[role]
        if (!creepClass) return

        creep = Game.creeps[creepName] = new creepClass(creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        // Organize creep in its room by its role

        room.myCreeps[role].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount += 1

        // Add the creep's name to the position in its room

        if (!creep.spawning) room.creepPositions.set(pack(creep.pos), creep.name)

        // Get the commune the creep is from

        const commune = creep.commune

        // If there is not vision in the commune, stop

        if (!commune) return

        if (!commune.controller.my) {
            creep.suicide()
            return
        }

        creep.preTickManager()

        creep.reservationManager()

        // If the creep isn't dying, organize by its roomFrom and role

        if (!creep.dying) commune.creepsFromRoom[role].push(creepName)

        // Record that the creep's existence in its roomFrom

        commune.creepsFromRoomAmount += 1
    }

    // Loop through all of my creeps

    for (const creepName in Memory.creeps) {
        try {
            processSingleCreep(creepName)
        } catch (err) {
            customLog(
                'Exception processing creep: ' + creepName + err,
                (err as any).stack,
                myColors.white,
                myColors.red,
            )
        }
    }

    if (Memory.CPULogging)
        customLog('Creep Organizer', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
}
