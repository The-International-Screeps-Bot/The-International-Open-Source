import {
    remoteHarvesterRoles,
    remoteRoles,
    maxRemoteRoomDistance,
    RemoteData,
    remoteTypeWeights,
    packedPosLength,
} from 'international/constants'
import { advancedFindDistance, customLog, findCarryPartsRequired, randomRange, randomTick } from 'international/utils'
import { unpackPosList } from 'other/codec'
import { CommuneManager } from './commune'

export class RemotesManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public preTickRun() {
        const { room } = this.communeManager

        // Loop through the commune's remote names

        for (let index = room.memory.remotes.length - 1; index >= 0; index -= 1) {
            // Get the name of the remote using the index

            const remoteName = room.memory.remotes[index]

            const remoteMemory = Memory.rooms[remoteName]

            // If the room isn't a remote, remove it from the remotes array

            if (remoteMemory.T !== 'remote' || remoteMemory.CN !== room.name) {
                this.communeManager.removeRemote(remoteName, index)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(remoteName).status !== Game.map.getRoomStatus(room.name).status) {
                this.communeManager.removeRemote(remoteName, index)
                continue
            }

            if (remoteMemory.data[RemoteData.abandon] > 0) {
                this.manageAbandonment(remoteName)
                continue
            }

            this.managePathCacheAllowance(remoteName)

            // Every x ticks ensure enemies haven't blocked off too much of the path

            if (randomTick(100)) {
                const safeDistance = advancedFindDistance(room.name, remoteName, {
                    typeWeights: remoteTypeWeights,
                    avoidAbandonedRemotes: true,
                })

                if (safeDistance > maxRemoteRoomDistance) {
                    remoteMemory.data[RemoteData.abandon] = randomRange(1000, 1500)
                    this.manageAbandonment(remoteName)
                    continue
                }

                const distance = advancedFindDistance(room.name, remoteName, {
                    typeWeights: remoteTypeWeights,
                })

                if (Math.round(safeDistance * 0.75) > distance) {
                    remoteMemory.data[RemoteData.abandon] = randomRange(1000, 1500)
                    this.manageAbandonment(remoteName)
                    continue
                }
            }

            remoteMemory.data[RemoteData.maxSourceIncome0] = SOURCE_ENERGY_NEUTRAL_CAPACITY / ENERGY_REGEN_TIME // default is 5
            remoteMemory.data[RemoteData.maxSourceIncome1] = SOURCE_ENERGY_NEUTRAL_CAPACITY / ENERGY_REGEN_TIME // default is 5
            remoteMemory.data[RemoteData.remoteSourceHarvester0] = 3
            remoteMemory.data[RemoteData.remoteSourceHarvester1] = remoteMemory.RSIDs[1] ? 3 : 0
            remoteMemory.data[RemoteData.remoteHauler0] = 0
            remoteMemory.data[RemoteData.remoteHauler1] = 0
            remoteMemory.data[RemoteData.remoteReserver] = 1

            // Get the remote

            const remote = Game.rooms[remoteName]

            const possibleReservation = room.energyCapacityAvailable >= 650
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // If the remote is reserved

            if (possibleReservation) {
                // We can potentially double our income

                remoteMemory.data[RemoteData.maxSourceIncome0] *= 2
                remoteMemory.data[RemoteData.maxSourceIncome1] *= 2

                // Increase the remoteHarvester need accordingly

                remoteMemory.data[RemoteData.remoteSourceHarvester0] *= 2
                remoteMemory.data[RemoteData.remoteSourceHarvester1] *= 2

                // If the reservation isn't soon to run out, relative to the room's sourceEfficacy average

                if (isReserved && remote.controller.reservation.ticksToEnd >= Math.min(remoteMemory.RE * 5, 2500))
                    remoteMemory.data[RemoteData.remoteReserver] = 0
            }

            if (remote) {
                remoteMemory.data[RemoteData.minDamage] = 0
                remoteMemory.data[RemoteData.minHeal] = 0

                // Increase the defenderNeed according to the enemy attackers' combined strength

                for (const enemyCreep of remote.enemyCreeps) {
                    remoteMemory.data[RemoteData.minDamage] +=
                        enemyCreep.combatStrength.heal + enemyCreep.combatStrength.heal * enemyCreep.defenceStrength ||
                        Math.max(Math.floor(enemyCreep.hits / 20), 1)
                    remoteMemory.data[RemoteData.minHeal] += enemyCreep.combatStrength.ranged
                }

                // If the controller is reserved and not by me

                if (remote.controller.reservation && remote.controller.reservation.username !== Memory.me)
                    remoteMemory.data[RemoteData.enemyReserved] = 1
                // If the controller is not reserved or is by us
                else remoteMemory.data[RemoteData.enemyReserved] = 0

                remoteMemory.data[RemoteData.remoteCoreAttacker] = remote.structures.invaderCore.length * 8
                remoteMemory.data[RemoteData.invaderCore] = remote.structures.invaderCore.length

                // Create need if there are any structures that need to be removed

                remoteMemory.data[RemoteData.remoteDismantler] = Math.min(remote.dismantleTargets.length, 1)
            }

            // If the remote is assumed to be reserved by an enemy or to be an invader core

            if (remoteMemory.data[RemoteData.enemyReserved] || remoteMemory.data[RemoteData.invaderCore]) {
                remoteMemory.data[RemoteData.maxSourceIncome0] = 0
                remoteMemory.data[RemoteData.maxSourceIncome1] = 0
                remoteMemory.data[RemoteData.remoteSourceHarvester0] = 0
                remoteMemory.data[RemoteData.remoteSourceHarvester1] = 0
                remoteMemory.data[RemoteData.remoteHauler0] = 0
                remoteMemory.data[RemoteData.remoteHauler1] = 0
            }
        }
    }

    public run() {
        // Loop through the commune's remote names

        for (const remoteName of this.communeManager.room.memory.remotes) {
            const remoteMemory = Memory.rooms[remoteName]
            const data = remoteMemory.data

            if (data[RemoteData.abandon]) continue
/*
            const remote = Game.rooms[remoteName]
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me
 */
            // Loop through each index of sourceEfficacies

            for (let sourceIndex = 0; sourceIndex < remoteMemory.RSPs.length; sourceIndex += 1) {

                const sourceHarvesterRole = `remoteSourceHarvester${sourceIndex as 0 | 1}` as
                    | 'remoteSourceHarvester0'
                    | 'remoteSourceHarvester1'
                const income = (data[RemoteData[sourceHarvesterRole]] = Math.min(
                    data[RemoteData[sourceHarvesterRole]],
                    data[RemoteData[`maxSourceIncome${sourceIndex as 0 | 1}`]],
                ))

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteMemory.data[RemoteData[`remoteHauler${sourceIndex as 0 | 1}`]] += findCarryPartsRequired(
                    remoteMemory.RSPs[sourceIndex].length / packedPosLength,
                    income,
                )
            }
        }
    }

    /**
     * Every x ticks see if sourcePath is safe to use
     */
    private managePathCacheAllowance(remoteName: string) {
        if (!randomTick(20)) return

        const remoteMemory = Memory.rooms[remoteName]

        for (let index in remoteMemory.RSIDs) {
            const pathRoomNames: Set<string> = new Set()

            for (const pos of unpackPosList(remoteMemory.RSPs[index])) {
                const roomName = pos.roomName

                if (pathRoomNames.has(roomName)) continue
                pathRoomNames.add(roomName)

                // See if the room has a valid type and isn't abandoned

                if (remoteTypeWeights[remoteMemory.T] !== Infinity && !remoteMemory.data[RemoteData.abandon]) continue

                remoteMemory.data[RemoteData.disableCachedPaths] = 1
                return
            }
        }

        remoteMemory.data[RemoteData.disableCachedPaths] = 0
    }

    private manageAbandonment(remoteName: string) {
        const remoteMemory = Memory.rooms[remoteName]

        remoteMemory.data[RemoteData.abandon] -= 1

        const abandonment = remoteMemory.data[RemoteData.abandon]

        for (const key in remoteMemory.data) {
            remoteMemory.data[key] = 0
        }

        remoteMemory.data[RemoteData.abandon] = abandonment
    }
}
