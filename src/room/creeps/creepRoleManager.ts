import './creepFunctions'

import { sourceHarvesterManager } from './roleManagers/sourceHarvesterManager'
import { haulerManager } from './roleManagers/haulerManager'
import { controllerUpgraderManager } from './roleManagers/controllerUpgraderManager'
import { mineralHarvesterManager } from './roleManagers/mineralHarvesterManager'
import { antifaManager } from './roleManagers/antifa/antifaManager'
import { maintainerManager } from './roleManagers/maintainerManager'
import { builderManager } from './roleManagers/builderManager'
import { scoutManager } from './roleManagers/scoutManager'
import { generalFuncs } from 'international/generalFunctions'
import { constants } from 'international/constants'

export function roleManager(room: Room) {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // Construct managers

    const managers: Record<CreepRoles, Function> = {
        sourceHarvester: sourceHarvesterManager,
        hauler: haulerManager,
        controllerUpgrader: controllerUpgraderManager,
        builder: builderManager,
        maintainer: maintainerManager,
        mineralHarvester: mineralHarvesterManager,
        scout: scoutManager,
        antifa: antifaManager,
    }

    // Loop through each role in managers

    for (const role of constants.creepRoles) {

        // Get the CPU used at the start

        const roleCPUStart = Game.cpu.getUsed()

        // Get the manager using the role

        const manager = managers[role]

        // Get the amount of creeps with the role

        const creepsOfRoleAmount = room.myCreeps[role].length

        // Iterate if there are no creeps of manager's role

        if (creepsOfRoleAmount == 0) continue

        // Run manager

        manager(room, room.myCreeps[role])

        // Log role stats

        generalFuncs.customLog(role + 's', 'Creeps: ' + creepsOfRoleAmount + ', CPU: ' + (Game.cpu.getUsed() - roleCPUStart).toFixed(2) + ', CPU Per Creep: ' + ((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(2), undefined)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) generalFuncs.customLog('Role Manager', 'CPU: ' + (Game.cpu.getUsed() - managerCPUStart).toFixed(2) + ', CPU Per Creep: ' + ((Game.cpu.getUsed() - managerCPUStart) / room.myCreepsAmount).toFixed(2), undefined, constants.colors.lightGrey)
}
