import './creepFunctions'

import { creepRoles, myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { controllerUpgraderManager } from './roleManagers/commune/controllerUpgrader'
import { mineralHarvesterManager } from './roleManagers/commune/mineralHarvesterManager'
import { maintainerManager } from './roleManagers/commune/maintainer'
import { builderManager } from './roleManagers/commune/builder'
import { scoutManager } from './roleManagers/international/scoutManager'
import { haulerManager } from './roleManagers/commune/hauler'
import { source2RemoteHarvesterManager } from './roleManagers/remote/source2RemoteHarvesterManager'
import { remoteHaulerManager } from './roleManagers/remote/remoteHauler'
import { claimerManager } from './roleManagers/international/claimerManager'
import { meleeDefenderManager } from './roleManagers/commune/meleeDefender'
import { hubHaulerManager } from './roleManagers/commune/hubHaulerManager'
import { fastFillerManager } from './roleManagers/commune/fastFillerManager'
import { source1RemoteHarvesterManager } from './roleManagers/remote/source1RemoteHarvesterManager'
import { remoteReserverManager } from './roleManagers/remote/remoteReserver'
import { remoteDefenderManager } from './roleManagers/remote/remoteDefenderManager'
import { vanguardManager } from './roleManagers/international/vanguardManager'
import { sourceHarvesterManager } from './roleManagers/commune/sourceHarvesterManager'
import { remoteCoreAttackerManager } from './roleManagers/remote/remoteCoreAttacker'
import { vanguardDefenderManager } from './roleManagers/international/vanguardDefender'
import { remoteDismantlerManager } from './roleManagers/remote/remoteDismantler'
import { antifaAssaulterManager } from './roleManagers/antifa/antifaAssaulter'

// Construct managers

const managers: Record<CreepRoles, Function> = {
     source1Harvester: sourceHarvesterManager,
     source2Harvester: sourceHarvesterManager,
     hauler: haulerManager,
     controllerUpgrader: controllerUpgraderManager,
     builder: builderManager,
     maintainer: maintainerManager,
     mineralHarvester: mineralHarvesterManager,
     hubHauler: hubHaulerManager,
     fastFiller: fastFillerManager,
     meleeDefender: meleeDefenderManager,
     source1RemoteHarvester: source1RemoteHarvesterManager,
     source2RemoteHarvester: source2RemoteHarvesterManager,
     remoteHauler: remoteHaulerManager,
     remoteReserver: remoteReserverManager,
     remoteDefender: remoteDefenderManager,
     remoteCoreAttacker: remoteCoreAttackerManager,
     remoteDismantler: remoteDismantlerManager,
     scout: scoutManager,
     claimer: claimerManager,
     vanguard: vanguardManager,
     vanguardDefender: vanguardDefenderManager,
     antifaAssaulter: antifaAssaulterManager,
     antifaSupporter: () => {},
}

export function creepRoleManager(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     let roleCPUStart
     let creepsOfRoleAmount

     // Loop through each role in managers

     for (const role of creepRoles) {
          roleCPUStart = Game.cpu.getUsed()

          // Get the amount of creeps with the role

          creepsOfRoleAmount = room.myCreeps[role].length

          // If there are no creeps for this manager, iterate

          if (!room.myCreeps[role].length) continue

          // Run manager

          managers[role](room, room.myCreeps[role])

          // Log role stats

          customLog(
               `${role}s`,
               `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(
                    2,
               )}, CPU Per Creep: ${((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(2)}`,
               undefined,
          )
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Role Manager',
               `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}, CPU Per Creep: ${(
                    room.myCreepsAmount ? (Game.cpu.getUsed() - managerCPUStart) /
                    room.myCreepsAmount : 0
               ).toFixed(2)}`,
               undefined,
               myColors.lightGrey,
          )
}
