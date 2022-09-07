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
import { CommuneManager } from 'room/communeManager'
import { RoomManager } from 'room/roomManager'

// Construct managers

const managers: Record<CreepRoles, Function> = {
    meleeDefender: MeleeDefender.meleeDefenderManager,
    allyVanguard: AllyVanguard.allyVanguardManager,
    antifaAssaulter: AntifaAssaulter.antifaAssaulterManager,
    claimer: Claimer.claimerManager,
    vanguardDefender: VanguardDefender.vanguardDefenderManager,
    remoteDefender: RemoteDefender.remoteDefenderManager,
    source1Harvester: SourceHarvester.sourceHarvesterManager,
    source2Harvester: SourceHarvester.sourceHarvesterManager,
    hauler: Hauler.haulerManager,
    maintainer: Maintainer.maintainerManager,
    fastFiller: FastFiller.fastFillerManager,
    hubHauler: HubHauler.hubHaulerManager,
    controllerUpgrader: ControllerUpgrader.controllerUpgraderManager,
    builder: Builder.builderManager,
    mineralHarvester: MineralHarvester.mineralHarvesterManager,
    source1RemoteHarvester: RemoteHarvester.RemoteHarvesterManager,
    source2RemoteHarvester: RemoteHarvester.RemoteHarvesterManager,
    remoteHauler: RemoteHauler.remoteHaulerManager,
    remoteReserver: RemoteReserver.remoteReserverManager,
    remoteCoreAttacker: RemoteCoreAttacker.remoteCoreAttackerManager,
    remoteDismantler: RemoteDismantler.remoteDismantlerManager,
    scout: Scout.scoutManager,
    vanguard: Vanguard.vanguardManager,
}

export class CreepRoleManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    public run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        for (const role of creepRoles) this.runManager(role)

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging)
            customLog(
                'Role Manager',
                `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}, CPU Per Creep: ${(this.roomManager.room.myCreepsAmount
                    ? (Game.cpu.getUsed() - managerCPUStart) / this.roomManager.room.myCreepsAmount
                    : 0
                ).toFixed(2)}`,
                undefined,
                myColors.lightGrey,
            )
    }

    private runManager(role: CreepRoles) {
        const roleCPUStart = Game.cpu.getUsed()

        // Get the amount of creeps with the role

        const creepsOfRoleAmount = this.roomManager.room.myCreeps[role].length

        // If there are no creeps for this manager, iterate

        if (!this.roomManager.room.myCreeps[role].length) return

        // Run manager

        try {
            managers[role](this.roomManager.room, this.roomManager.room.myCreeps[role])
        } catch (err) {
            customLog(
                'Exception processing creep role: ' + role + ' in ' + this.roomManager.room.name + '. ',
                err + '\n' + (err as any).stack,
                myColors.white,
                myColors.red,
            )
        }

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
}
