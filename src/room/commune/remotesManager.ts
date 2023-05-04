import {
    remoteRoles,
    maxRemoteRoomDistance,
    remoteTypeWeights,
    packedPosLength,
    RoomMemoryKeys,
    RoomTypes,
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

        for (let index = room.memory[RoomMemoryKeys.remotes].length - 1; index >= 0; index -= 1) {
            // Get the name of the remote using the index

            const remoteName = room.memory[RoomMemoryKeys.remotes][index]
            const remoteMemory = Memory.rooms[remoteName]

            // Reset values to avoid error

            for (const i in remoteMemory[RoomMemoryKeys.remoteSources]) {
                remoteMemory[RoomMemoryKeys.maxSourceIncome][i] = 0
                remoteMemory[RoomMemoryKeys.remoteSourceHarvesters][i] = 0
                remoteMemory[RoomMemoryKeys.remoteHaulers][i] = 0
            }
            remoteMemory[RoomMemoryKeys.remoteReserver] = 0

            // If the room isn't a remote, remove it from the remotes array

            if (
                remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote ||
                remoteMemory[RoomMemoryKeys.commune] !== room.name
            ) {
                this.communeManager.removeRemote(remoteName, index)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(remoteName).status !== Game.map.getRoomStatus(room.name).status) {
                this.communeManager.removeRemote(remoteName, index)
                continue
            }

            if (remoteMemory[RoomMemoryKeys.abandon] > 0) {
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
                    remoteMemory[RoomMemoryKeys.abandon] = randomRange(1000, 1500)
                    this.manageAbandonment(remoteName)
                    continue
                }

                const distance = advancedFindDistance(room.name, remoteName, {
                    typeWeights: remoteTypeWeights,
                })

                if (Math.round(safeDistance * 0.75) > distance) {
                    remoteMemory[RoomMemoryKeys.abandon] = randomRange(1000, 1500)
                    this.manageAbandonment(remoteName)
                    continue
                }
            }

            for (const i in remoteMemory[RoomMemoryKeys.remoteSources]) {
                remoteMemory[RoomMemoryKeys.maxSourceIncome][i] = SOURCE_ENERGY_NEUTRAL_CAPACITY / ENERGY_REGEN_TIME
            }
            remoteMemory[RoomMemoryKeys.remoteReserver] = 5

            // Get the remote

            const remote = Game.rooms[remoteName]

            const possibleReservation = room.energyCapacityAvailable >= 650
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // If the remote is reserved

            if (possibleReservation) {
                // We can potentially double our income

                for (const i in remoteMemory[RoomMemoryKeys.remoteSources]) {
                    remoteMemory[RoomMemoryKeys.maxSourceIncome][i] *= 2
                }

                // If the reservation isn't soon to run out, relative to the room's sourceEfficacy average

                if (
                    isReserved &&
                    remote.controller.reservation.ticksToEnd >=
                        Math.min(remoteMemory[RoomMemoryKeys.reservationEfficacy] * 5, 2500)
                )
                    remoteMemory[RoomMemoryKeys.remoteReserver] = 0
            }

            if (remote) {
                /*
                remoteMemory[RoomMemoryKeys.minDamage] = 0
                remoteMemory[RoomMemory\google-sheets\flowchartKeys.minHeal] = 0

                // Increase the defenderNeed according to the enemy attackers' combined strength

                for (const enemyCreep of remote.enemyCreeps) {
                    remoteMemory[RoomMemoryKeys.minDamage] +=
                        enemyCreep.combatStrength.heal + enemyCreep.combatStrength.heal * enemyCreep.defenceStrength ||
                        Math.max(Math.floor(enemyCreep.hits / 20), 1)
                    remoteMemory[RoomMemoryKeys.minHeal] += enemyCreep.combatStrength.ranged
                } */

                // Temporary measure while DynamicSquads are in progress

                if (remote.enemyAttackers.length) {

                    remoteMemory[RoomMemoryKeys.abandon] = randomRange(1000, 1500)
                    continue
                }

                // If the controller is reserved and not by me

                if (remote.controller.reservation && remote.controller.reservation.username !== Memory.me)
                    remoteMemory[RoomMemoryKeys.enemyReserved] = true
                // If the controller is not reserved or is by us
                else remoteMemory[RoomMemoryKeys.enemyReserved] = false

                remoteMemory[RoomMemoryKeys.remoteCoreAttacker] = remote.roomManager.structures.invaderCore.length * 8
                remoteMemory[RoomMemoryKeys.invaderCore] = remote.roomManager.structures.invaderCore.length

                // Create need if there are any structures that need to be removed

                remoteMemory[RoomMemoryKeys.remoteDismantler] = Math.min(remote.dismantleTargets.length, 1)
            }

            // If the remote is assumed to be reserved by an enemy or an invader core

            if (remoteMemory[RoomMemoryKeys.enemyReserved] || remoteMemory[RoomMemoryKeys.invaderCore]) {
                for (const i in remoteMemory[RoomMemoryKeys.maxSourceIncome]) {
                    remoteMemory[RoomMemoryKeys.maxSourceIncome][i] = 0
                }
                remoteMemory[RoomMemoryKeys.remoteReserver] = 0
            }
        }
    }

    public run() {
        // Loop through the commune's remote names

        for (const remoteName of this.communeManager.room.memory[RoomMemoryKeys.remotes]) {
            const remoteMemory = Memory.rooms[remoteName]

            if (remoteMemory[RoomMemoryKeys.abandon]) continue

            /*
            const remote = Game.rooms[remoteName]
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me
 */
            // Loop through each index of sourceEfficacies

            for (
                let sourceIndex = 0;
                sourceIndex < remoteMemory[RoomMemoryKeys.remoteSourcePaths].length;
                sourceIndex += 1
            ) {
                if (remoteMemory[RoomMemoryKeys.maxSourceIncome][sourceIndex] === 0) continue

                const income = Math.min(
                    remoteMemory[RoomMemoryKeys.remoteSourceHarvesters][sourceIndex] * HARVEST_POWER,
                    remoteMemory[RoomMemoryKeys.maxSourceIncome][sourceIndex],
                )

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteMemory[RoomMemoryKeys.remoteHaulers][sourceIndex] += findCarryPartsRequired(
                    remoteMemory[RoomMemoryKeys.remoteSourcePaths][sourceIndex].length / packedPosLength,
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

        for (let index in remoteMemory[RoomMemoryKeys.remoteSources]) {
            const pathRoomNames: Set<string> = new Set()

            for (const pos of unpackPosList(remoteMemory[RoomMemoryKeys.remoteSourcePaths][index])) {
                const roomName = pos.roomName

                if (pathRoomNames.has(roomName)) continue
                pathRoomNames.add(roomName)

                // See if the room has a valid type and isn't abandoned

                if (
                    remoteTypeWeights[remoteMemory[RoomMemoryKeys.type]] !== Infinity &&
                    !remoteMemory[RoomMemoryKeys.abandon]
                )
                    continue

                remoteMemory[RoomMemoryKeys.disableCachedPaths] = true
                return
            }
        }

        remoteMemory[RoomMemoryKeys.disableCachedPaths] = false
    }

    private manageAbandonment(remoteName: string) {
        const remoteMemory = Memory.rooms[remoteName]

        remoteMemory[RoomMemoryKeys.abandon] -= 1

        const abandonment = remoteMemory[RoomMemoryKeys.abandon]

        remoteMemory[RoomMemoryKeys.abandon] = abandonment
    }
}
