import { advancedFindDistance, findClosestRoomName, randomRange } from 'utils/utils'
import { collectiveManager } from './collective'
import { roomUtils } from 'room/roomUtils'
import {
    CombatRequestKeys,
    HaulRequestKeys,
    RoomMemoryKeys,
    RoomTypes,
    WorkRequestKeys,
    antifaRoles,
    maxCombatDistance,
    maxHaulDistance,
    maxWorkRequestDistance,
} from './constants'
import { indexOf } from 'lodash'

// Should adsorb the request content of tickInit
class RequestsManager {
    run() {
        this.runWorkRequests()
        this.runCombatRequests()
        this.runHaulRequests()
    }

    private runWorkRequests() {
        let reservedGCL = Game.gcl.level - collectiveManager.communes.size

        // Subtract the number of workRequests with responders

        for (const roomName in Memory.workRequests) {
            if (!Memory.workRequests[roomName][WorkRequestKeys.responder]) continue

            reservedGCL -= 1
        }

        const communesForResponding = []

        for (const roomName of collectiveManager.communes) {
            if (Memory.rooms[roomName][RoomMemoryKeys.workRequest]) continue

            if (Game.rooms[roomName].energyCapacityAvailable < 650) continue

            const room = Game.rooms[roomName]
            if (!room.roomManager.structures.spawn.length) continue

            communesForResponding.push(roomName)
        }

        // Update dynamicScores if necessary

        for (const roomName in Memory.workRequests) {
            const roomMemory = Memory.rooms[roomName]
            if (
                Game.time - roomMemory[RoomMemoryKeys.dynamicScoreUpdate] <
                randomRange(19000, 20000)
            )
                continue

            roomUtils.findDynamicScore(roomName)
        }

        // Assign and abandon workRequests, in order of score

        for (const roomName of collectiveManager.workRequestsByScore) {
            const request = Memory.workRequests[roomName]

            if (!request) continue

            if (request[WorkRequestKeys.abandon] > 0) {
                request[WorkRequestKeys.abandon] -= 1
                continue
            }

            delete request[WorkRequestKeys.abandon]

            if (
                request[WorkRequestKeys.responder] &&
                collectiveManager.communes.has(request[WorkRequestKeys.responder])
            )
                continue

            if (!global.settings.autoClaim) continue

            // If there is not enough reserved GCL to make a new request

            if (reservedGCL <= 0) continue
            if (collectiveManager.communes.size >= collectiveManager.maxCommunes) continue

            // If the requested room is no longer neutral

            const type = Memory.rooms[roomName][RoomMemoryKeys.type]

            if (type !== RoomTypes.neutral && type !== RoomTypes.commune) {
                // Delete the request

                Memory.workRequests[roomName][WorkRequestKeys.abandon] = 20000
                continue
            }

            const communeName = findClosestRoomName(roomName, communesForResponding)
            if (!communeName) break

            // Run a more simple and less expensive check, then a more complex and expensive to confirm. If the check fails, abandon the room for some time

            if (
                Game.map.getRoomLinearDistance(communeName, roomName) > maxWorkRequestDistance ||
                advancedFindDistance(communeName, roomName, {
                    typeWeights: {
                        keeper: Infinity,
                        enemy: Infinity,
                        ally: Infinity,
                    },
                }) > maxWorkRequestDistance
            ) {
                Memory.workRequests[roomName][WorkRequestKeys.abandon] = 20000
                continue
            }

            // Otherwise assign the request to the room, and record as such in Memory

            Memory.rooms[communeName][RoomMemoryKeys.workRequest] = roomName
            Memory.workRequests[roomName][WorkRequestKeys.responder] = communeName

            reservedGCL -= 1

            communesForResponding.splice(indexOf(communesForResponding, communeName), 1)
        }
    }

    private runCombatRequests() {
        for (const requestName in Memory.combatRequests) {
            const request = Memory.combatRequests[requestName]

            if (request[CombatRequestKeys.abandon]) request[CombatRequestKeys.abandon] -= 1

            if (request[CombatRequestKeys.responder]) {
                collectiveManager.creepsByCombatRequest[requestName] = {}
                for (const role of antifaRoles)
                    collectiveManager.creepsByCombatRequest[requestName][role] = []
                request[CombatRequestKeys.quads] = 0
                continue
            }

            if (request[CombatRequestKeys.abandon]) continue

            // Filter communes that don't have the combatRequest target already

            const communes = []

            for (const roomName of collectiveManager.communes) {
                /* if (Memory.rooms[roomName].combatRequests.includes(requestName)) continue */

                // Ensure the combatRequest isn't responded to by the room the request is for

                if (requestName === roomName) continue

                const room = Game.rooms[roomName]
                if (!room.roomManager.structures.spawn.length) continue

                // Ensure we aren't responding to too many requests for our energy level

                if (room.storage && room.controller.level >= 4) {
                    if (
                        room.memory[RoomMemoryKeys.combatRequests].length + 1 >=
                        room.communeManager.maxCombatRequests
                    )
                        continue
                } else {
                    if (
                        room.memory[RoomMemoryKeys.combatRequests].length + 1 >=
                        room.communeManager.estimatedEnergyIncome / 10
                    )
                        continue
                }

                // Ensure we can afford the creeps required

                const minRangedAttackCost = room.communeManager.findMinRangedAttackCost(
                    request[CombatRequestKeys.minDamage],
                )
                const minMeleeHealCost = room.communeManager.findMinHealCost(
                    request[CombatRequestKeys.minMeleeHeal] +
                        (request[CombatRequestKeys.maxTowerDamage] || 0),
                )
                const minRangedHealCost = room.communeManager.findMinHealCost(
                    request[CombatRequestKeys.minRangedHeal],
                )

                if (minRangedAttackCost + minRangedHealCost > room.energyCapacityAvailable) continue

                const minAttackCost = room.communeManager.findMinMeleeAttackCost(
                    request[CombatRequestKeys.minDamage],
                )
                if (minAttackCost > room.energyCapacityAvailable) continue

                communes.push(roomName)
            }

            const communeName = findClosestRoomName(requestName, communes)
            if (!communeName) continue

            // Run a more simple and less expensive check, then a more complex and expensive to confirm

            if (
                Game.map.getRoomLinearDistance(communeName, requestName) > maxCombatDistance ||
                advancedFindDistance(communeName, requestName, {
                    typeWeights: {
                        keeper: Infinity,
                        enemy: Infinity,
                        ally: Infinity,
                    },
                }) > maxCombatDistance
            ) {
                request[CombatRequestKeys.abandon] = 20000
                continue
            }

            // Otherwise assign the request to the room, and record as such in Memory

            Memory.rooms[communeName][RoomMemoryKeys.combatRequests].push(requestName)
            request[CombatRequestKeys.responder] = communeName

            collectiveManager.creepsByCombatRequest[requestName] = {}
            for (const role of antifaRoles)
                collectiveManager.creepsByCombatRequest[requestName][role] = []
        }
    }

    private runHaulRequests() {
        for (const requestName in Memory.haulRequests) {
            const request = Memory.haulRequests[requestName]

            if (request[HaulRequestKeys.abandon]) request[HaulRequestKeys.abandon] -= 1

            if (request[HaulRequestKeys.responder]) {
                collectiveManager.creepsByHaulRequest[requestName] = []
                continue
            }

            // Filter communes that don't have the combatRequest target already

            const communes = []

            for (const roomName of collectiveManager.communes) {
                if (Memory.rooms[roomName][RoomMemoryKeys.haulRequests].includes(requestName))
                    continue

                const room = Game.rooms[roomName]
                if (!room.roomManager.structures.spawn.length) continue

                // Ensure we aren't responding to too many requests for our energy level

                if (room.controller.level < 4) continue
                if (!room.storage) continue

                if (
                    room.roomManager.resourcesInStoringStructures.energy /
                        (20000 + room.controller.level * 1000) <
                    room.memory[RoomMemoryKeys.haulRequests].length
                )
                    continue

                communes.push(roomName)
            }

            const communeName = findClosestRoomName(requestName, communes)
            if (!communeName) continue

            // Run a more simple and less expensive check, then a more complex and expensive to confirm

            if (
                Game.map.getRoomLinearDistance(communeName, requestName) > maxHaulDistance ||
                advancedFindDistance(communeName, requestName, {
                    typeWeights: {
                        keeper: Infinity,
                        enemy: Infinity,
                        ally: Infinity,
                    },
                }) > maxHaulDistance
            ) {
                request[HaulRequestKeys.abandon] = 20000
                continue
            }

            // Otherwise assign the request to the room, and record as such in Memory

            Memory.rooms[communeName][RoomMemoryKeys.haulRequests].push(requestName)
            request[HaulRequestKeys.responder] = communeName

            collectiveManager.creepsByHaulRequest[requestName] = []
        }
    }
}

export const requestsManager = new RequestsManager()
