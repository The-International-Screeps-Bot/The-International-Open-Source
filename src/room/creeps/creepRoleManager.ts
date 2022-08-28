import './creepFunctions'

import { creepRoles, myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { Maintainer } from './roleManagers/commune/maintainer'
import { Builder } from './roleManagers/commune/builder'
import { Hauler } from './roleManagers/commune/hauler'
import { RemoteHauler } from './roleManagers/remote/remoteHauler'
import { Claimer } from './roleManagers/international/claimer'
import { AllyVanguard } from './roleManagers/international/allyVanguard'
import { HubHauler } from './roleManagers/commune/hubHaulerManager'
import { ControllerUpgrader } from './roleManagers/commune/controllerUpgrader'
import { SourceHarvester } from './roleManagers/commune/sourceHarvester'
import { MineralHarvester } from './roleManagers/commune/mineralHarvester'
import { FastFiller } from './roleManagers/commune/fastFiller'
import { MeleeDefender } from './roleManagers/commune/meleeDefender'
import { RemoteHarvester } from './roleManagers/remote/remoteHarvesterFunctions'
import { RemoteReserver } from './roleManagers/remote/remoteReserver'
import { RemoteDefender } from './roleManagers/remote/remoteDefender'
import { RemoteCoreAttacker } from './roleManagers/remote/remoteCoreAttacker'
import { RemoteDismantler } from './roleManagers/remote/remoteDismantler'
import { Scout } from './roleManagers/international/scout'
import { Vanguard } from './roleManagers/international/vanguard'
import { AntifaAssaulter } from './roleManagers/antifa/antifaAssaulter'
import { VanguardDefender } from './roleManagers/international/vanguardDefender'

// Construct managers

const managers: Record<CreepRoles, Function> = {
    source1Harvester: SourceHarvester.sourceHarvesterManager,
    source2Harvester: SourceHarvester.sourceHarvesterManager,
    hauler: Hauler.haulerManager,
    controllerUpgrader: ControllerUpgrader.controllerUpgraderManager,
    builder: Builder.builderManager,
    maintainer: Maintainer.maintainerManager,
    mineralHarvester: MineralHarvester.mineralHarvesterManager,
    hubHauler: HubHauler.hubHaulerManager,
    fastFiller: FastFiller.fastFillerManager,
    meleeDefender: MeleeDefender.meleeDefenderManager,
    source1RemoteHarvester: RemoteHarvester.source1RemoteHarvesterManager,
    source2RemoteHarvester: RemoteHarvester.source2RemoteHarvesterManager,
    remoteHauler: RemoteHauler.remoteHaulerManager,
    remoteReserver: RemoteReserver.remoteReserverManager,
    remoteDefender: RemoteDefender.remoteDefenderManager,
    remoteCoreAttacker: RemoteCoreAttacker.remoteCoreAttackerManager,
    remoteDismantler: RemoteDismantler.remoteDismantlerManager,
    scout: Scout.scoutManager,
    claimer: Claimer.claimerManager,
    vanguard: Vanguard.vanguardManager,
    vanguardDefender: VanguardDefender.vanguardDefenderManager,
    allyVanguard: AllyVanguard.allyVanguardManager,
    antifaAssaulter: AntifaAssaulter.antifaAssaulterManager,
}

export function creepRoleManager(room: Room) {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    let roleCPUStart
    let creepsOfRoleAmount

    // Loop through each role in managers

    function processSingleRole(role: CreepRoles) {
        roleCPUStart = Game.cpu.getUsed()

        // Get the amount of creeps with the role

        creepsOfRoleAmount = room.myCreeps[role].length

        // If there are no creeps for this manager, iterate

        if (!room.myCreeps[role].length) return

        // Run manager

        managers[role](room, room.myCreeps[role])

        // Log role stats

        customLog(
            `${role}s`,
            `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(2)}, CPU Per Creep: ${(
                (Game.cpu.getUsed() - roleCPUStart) /
                creepsOfRoleAmount
            ).toFixed(2)}`,
            undefined,
        )
    }

    for (const role of creepRoles) {
        try {
            processSingleRole(role)
        } catch (err) {
            customLog(
                'Exception processing creep role: ' + role + ' in ' + room.name + '. ',
                err + '\n' + (err as any).stack,
                myColors.white,
                myColors.red,
            )
        }
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog(
            'Role Manager',
            `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}, CPU Per Creep: ${(room.myCreepsAmount
                ? (Game.cpu.getUsed() - managerCPUStart) / room.myCreepsAmount
                : 0
            ).toFixed(2)}`,
            undefined,
            myColors.lightGrey,
        )
}
