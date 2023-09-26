import {
    RoomMemoryKeys,
    RoomTypes,
    chant,
    customColors,
    enemyDieChants,
    friendlyDieChants,
    powerCreepClassNames,
} from 'international/constants'
import { statsManager } from 'international/statsManager'
import { customLog } from 'utils/logging'
import { forCoordsInRange, randomOf, randomRange, randomTick } from 'utils/utils'
import { RoomManager } from '../room'
import { packCoord, unpackCoord } from 'other/codec'

export class EndTickCreepManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    public run() {
        const { room } = this.roomManager
        if (!this.roomManager.room.myCreepsAmount) return

        if (
            Memory.rooms[room.name][RoomMemoryKeys.type] === RoomTypes.commune &&
            room.communeManager.spawningStructuresManager.activeSpawns
        ) {
            for (const spawn of room.communeManager.spawningStructuresManager.activeSpawns) {
                const creep = Game.creeps[spawn.spawning.name]

                if (!creep.moveRequest) continue
                if (!room.moveRequests[creep.moveRequest]) {
                    creep.moved = 'moved'
                    continue
                }

                room.roomManager.recurseMoveRequestOrder += 1

                const creepNameAtPos =
                    room.creepPositions[creep.moveRequest] ||
                    room.powerCreepPositions[creep.moveRequest]
                if (!creepNameAtPos) {
                    creep.moved = creep.moveRequest
                    delete room.moveRequests[creep.moveRequest]

                    if (global.settings.roomVisuals) {
                        const moved = unpackCoord(creep.moved)

                        room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                            fill: customColors.black,
                            opacity: 0.7,
                        })
                    }
                    continue
                }

                // There is a creep at the position
                // just get us space to move into

                const creepAtPos = Game.creeps[creepNameAtPos] || Game.powerCreeps[creepNameAtPos]
                const packedCoord = packCoord(creep.pos)

                if (global.settings.roomVisuals) {
                    const moved = unpackCoord(creep.moveRequest)

                    room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                        fill: customColors.pink,
                        opacity: 0.7,
                    })
                }

                if (creepAtPos.shove(new Set([packedCoord]))) {
                    creep.room.errorVisual(unpackCoord(creep.moveRequest))

                    creep.moved = creep.moveRequest
                    delete room.moveRequests[creep.moved]
                    delete creep.moveRequest
                }

                continue
            }
        }

        // Power creeps go first

        for (const className of powerCreepClassNames) {
            for (const creepName of this.roomManager.room.myPowerCreeps[className]) {
                const creep = Game.powerCreeps[creepName]

                creep.endRun()
                creep.recurseMoveRequest()

                if (global.settings.creepSay && creep.message.length) creep.say(creep.message)
            }
        }

        // Normal creeps go second

        for (const role in this.roomManager.room.myCreeps) {
            for (const creepName of this.roomManager.room.myCreeps[role as CreepRoles]) {
                const creep = Game.creeps[creepName]

                creep.endRun()
                creep.recurseMoveRequest()

                if (global.settings.creepSay && creep.message.length) creep.say(creep.message)
            }
        }

        this.runChant()
    }

    /**
     * If enabled and there is a chant this tick, have a random creeps that isn't on an exit say the chant
     */
    private runChant() {
        if (!global.settings.creepChant) return

        const currentChant = chant[Memory.chantIndex]
        if (!currentChant) return

        let creeps: (Creep | PowerCreep)[] = this.roomManager.room.find(FIND_MY_POWER_CREEPS, {
            filter: creep => !creep.isOnExit,
        })
        creeps = creeps.concat(
            this.roomManager.room.find(FIND_MY_CREEPS, {
                filter: creep => !creep.isOnExit,
            }),
        )
        if (!creeps.length) return

        const usedNames = this.runDeadChant()

        creeps.filter(creep => !usedNames.has(creep.name))
        if (!creeps.length) return

        randomOf(creeps).say(currentChant, true)
    }

    private runDeadChant() {
        const usedNames: Set<string> = new Set()

        const tombstones = this.roomManager.room.find(FIND_TOMBSTONES, {
            filter: tombstone => tombstone.deathTime + 3 > Game.time,
        })
        if (tombstones.length) {
            for (const tombstone of tombstones) {
                let chant: string
                if (
                    tombstone.creep.owner.username === Memory.me ||
                    global.settings.allies.includes(tombstone.creep.owner.username)
                ) {
                    chant = randomOf(friendlyDieChants)
                } else {
                    chant = randomOf(enemyDieChants)
                }

                forCoordsInRange(tombstone.pos, 4, coord => {
                    const creepName = this.roomManager.room.creepPositions[packCoord(coord)]
                    if (!creepName) return

                    usedNames.add(creepName)
                    Game.creeps[creepName].say(chant, true)
                })
            }
        }

        return usedNames
    }
}
