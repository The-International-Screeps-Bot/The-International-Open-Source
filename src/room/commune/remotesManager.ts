import { minHarvestWorkRatio, remoteHarvesterRoles, RemoteData, remoteRoles, maxRemoteRoomDistance } from 'international/constants'
import { advancedFindDistance, customLog, findCarryPartsRequired, randomTick } from 'international/utils'
import { CommuneManager } from './communeManager'

export class RemotesManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public stage1() {
        // Loop through the commune's remote names

        for (let index = this.communeManager.room.memory.remotes.length - 1; index >= 0; index -= 1) {
            // Get the name of the remote using the index

            const remoteName = this.communeManager.room.memory.remotes[index]

            const remoteMemory = Memory.rooms[remoteName]

            // If the room isn't a remote, remove it from the remotes array

            if (remoteMemory.T !== 'remote' || remoteMemory.commune !== this.communeManager.room.name) {

                this.communeManager.room.memory.remotes.splice(index, 1)
                continue
            }

            if (remoteMemory.data[RemoteData.abandon] > 0) {
                this.manageAbandonment(remoteName)
                continue
            }

            // Every 5~ ticks ensure enemies haven't blocked off too much of the path

            if (randomTick(100)) {

                const safeDistance = advancedFindDistance(this.communeManager.room.name, remoteName, {
                    typeWeights: {
                        keeper: Infinity,
                        enemy: Infinity,
                        enemyRemote: Infinity,
                        ally: Infinity,
                        allyRemote: Infinity,
                    },
                    avoidAbandonedRemotes: true,
                })

                if (safeDistance > maxRemoteRoomDistance) {

                    remoteMemory.data[RemoteData.abandon] = 1500
                    this.manageAbandonment(remoteName)
                    continue
                }

                const distance = advancedFindDistance(this.communeManager.room.name, remoteName, {
                    typeWeights: {
                        keeper: Infinity,
                        enemy: Infinity,
                        enemyRemote: Infinity,
                        ally: Infinity,
                        allyRemote: Infinity,
                    },
                })

                if (Math.round(safeDistance * 0.75) > distance) {

                    remoteMemory.data[RemoteData.abandon] = 1500
                    this.manageAbandonment(remoteName)
                    continue
                }
            }

            remoteMemory.data[RemoteData.source1RemoteHarvester] = 3
            remoteMemory.data[RemoteData.source2RemoteHarvester] = remoteMemory.SIDs[1] ? 3 : 0
            remoteMemory.data[RemoteData.remoteHauler0] = 0
            remoteMemory.data[RemoteData.remoteHauler1] = 0
            remoteMemory.data[RemoteData.remoteReserver] = 1

            // Get the remote

            const remote = Game.rooms[remoteName]

            const possibleReservation = this.communeManager.room.energyCapacityAvailable >= 650
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // If the remote is reserved

            if (possibleReservation) {
                // Increase the remoteHarvester need accordingly

                remoteMemory.data[RemoteData.source1RemoteHarvester] *= 2
                remoteMemory.data[RemoteData.source2RemoteHarvester] *= 2

                // If the reservation isn't soon to run out, relative to the room's sourceEfficacy average

                if (isReserved && remote.controller.reservation.ticksToEnd >= Math.min(remoteMemory.RE * 5, 2500))
                    remoteMemory.data[RemoteData.remoteReserver] = 0
            }

            if (remote) {
                remoteMemory.data[RemoteData.minDamage] = 0
                remoteMemory.data[RemoteData.minHeal] = 0

                // Increase the defenderNeed according to the enemy attackers' combined strength

                for (const enemyCreep of remote.enemyCreeps) {
                    remoteMemory.data[RemoteData.minDamage] += 10 + enemyCreep.healStrength
                    remoteMemory.data[RemoteData.minHeal] += enemyCreep.attackStrength
                }

                // If the controller is reserved and not by me

                if (remote.controller.reservation && remote.controller.reservation.username !== Memory.me)
                    remoteMemory.data[RemoteData.enemyReserved] = 1
                // If the controller is not reserved or is by us
                else remoteMemory.data[RemoteData.enemyReserved] = 0

                remoteMemory.data[RemoteData.remoteCoreAttacker] = remote.structures.invaderCore.length
                remoteMemory.data[RemoteData.invaderCore] = remote.structures.invaderCore.length

                // Create need if there are any walls or enemy owner structures (not including invader cores)

                remoteMemory.data[RemoteData.remoteDismantler] =
                    Math.min(remote.actionableWalls.length, 1) || Math.min(remote.dismantleTargets.length, 1)
            }

            // If the remote is assumed to be reserved by an enemy

            if (remoteMemory.data[RemoteData.enemyReserved]) {
                remoteMemory.data[RemoteData.source1RemoteHarvester] = 0
                remoteMemory.data[RemoteData.source2RemoteHarvester] = 0
                remoteMemory.data[RemoteData.remoteHauler0] = 0
                remoteMemory.data[RemoteData.remoteHauler1] = 0
            }

            // If there is assumed to be an invader core

            if (remoteMemory.data[RemoteData.invaderCore]) {
                remoteMemory.data[RemoteData.source1RemoteHarvester] = 0
                remoteMemory.data[RemoteData.source2RemoteHarvester] = 0
                remoteMemory.data[RemoteData.remoteHauler0] = 0
                remoteMemory.data[RemoteData.remoteHauler1] = 0
            }
        }
    }

    public stage2() {
        // Loop through the commune's remote names

        for (const remoteName of this.communeManager.room.memory.remotes) {

            const remoteMemory = Memory.rooms[remoteName]

            if (remoteMemory.data[RemoteData.abandon]) continue

            const remote = Game.rooms[remoteName]
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // Loop through each index of sourceEfficacies

            for (let sourceIndex = 0; sourceIndex < remoteMemory.SE.length; sourceIndex += 1) {
                // Get the income based on the reservation of the this and remoteHarvester need
                // Multiply remote harvester need by 1.6~ to get 3 to 5 and 6 to 10, converting work part need to income expectation

                const income = Math.max(
                    (isReserved ? 10 : 5) -
                        Math.floor(
                            Math.max(remoteMemory.data[RemoteData[remoteHarvesterRoles[sourceIndex]]], 0) *
                                minHarvestWorkRatio,
                        ),
                    0,
                )

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteMemory.data[RemoteData[`remoteHauler${sourceIndex as 0 | 1}`]] += findCarryPartsRequired(
                    remoteMemory.SE[sourceIndex],
                    income,
                )
            }
        }
    }

    private manageAbandonment(remoteName: string) {

        const remoteMemory = Memory.rooms[remoteName]

        remoteMemory.data[RemoteData.abandon] -= 1

        for (const key in remoteMemory.data) {

            if (parseInt(key) === RemoteData.abandon) continue
            remoteMemory.data[key] = 0
        }
    }
}
