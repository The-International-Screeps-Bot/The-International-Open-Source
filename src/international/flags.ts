import { Dashboard, Rectangle, Table } from 'screeps-viz'
import { Result, RoomMemoryKeys, RoomTypes, customColors, ourImpassibleStructuresSet } from './constants'
import { collectiveManager } from './collective'
import { CombatRequestTypes } from 'types/internationalRequests'
import { roomUtils } from 'room/roomUtils'
import { packCoord } from 'other/codec'
import { findObjectWithID, isAlly } from 'utils/utils'

export class FlagManager {
    run() {
        for (const flagName in Game.flags) {
            const flagNameParts = flagName.split(' ')

            if (!this[flagNameParts[0] as keyof FlagManager]) continue
            this[flagNameParts[0] as keyof FlagManager](flagName, flagNameParts)
        }
    }

    /**
     * Tricks typescript into accepting the dynamic function call in run()
     */
    public doNothing(flagName: string, flagNameParts: string[]) {}

    private internationalDataVisuals(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) {
            flag.setColor(COLOR_RED)
            return
        }

        flag.setColor(COLOR_GREEN)
        room.roomManager.roomVisualsManager.internationalDataVisuals()
    }

    private incomingTransactions(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) {
            flag.setColor(COLOR_RED)
            return
        }

        flag.setColor(COLOR_GREEN)

        const headers = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

        const data: any[][] = []

        for (const transaction of Game.market.incomingTransactions) {
            const roomFromMemory = Memory.rooms[transaction.from] || {} as RoomMemory
            const roomToMemory = Memory.rooms[transaction.to] || {} as RoomMemory

            data.push([
                transaction.from +
                    ' (' +
                    (roomFromMemory[RoomMemoryKeys.type] === RoomTypes.commune
                        ? Memory.me
                        : roomFromMemory[RoomMemoryKeys.owner] || 'unknown') +
                    ')',
                '-->',
                transaction.to +
                    ' (' +
                    (roomToMemory[RoomMemoryKeys.type] === RoomTypes.commune
                        ? Memory.me
                        : roomToMemory[RoomMemoryKeys.owner] || 'unknown') +
                    ')',
                transaction.resourceType,
                transaction.amount,
                Game.time - transaction.time,
            ])
        }

        const height = 3 + data.length

        Dashboard({
            config: {
                room: room.roomManager.room.name,
            },
            widgets: [
                {
                    pos: {
                        x: 1,
                        y: 1,
                    },
                    width: 47,
                    height,
                    widget: Rectangle({
                        data: Table(() => ({
                            data,
                            config: {
                                label: 'Incoming Transactions',
                                headers,
                            },
                        })),
                    }),
                },
            ],
        })
    }

    private outgoingTransactions(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) {
            flag.setColor(COLOR_RED)
            return
        }

        flag.setColor(COLOR_GREEN)

        const headers = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

        const data: any[][] = []

        for (const transaction of Game.market.outgoingTransactions) {
            const roomFromMemory = Memory.rooms[transaction.from] || {} as RoomMemory
            const roomToMemory = Memory.rooms[transaction.to] || {} as RoomMemory

            data.push([
                transaction.from +
                    ' (' +
                    (roomFromMemory[RoomMemoryKeys.type] === RoomTypes.commune
                        ? Memory.me
                        : roomFromMemory[RoomMemoryKeys.owner] || 'unknown') +
                    ')',
                '-->',
                transaction.to +
                    ' (' +
                    (roomToMemory[RoomMemoryKeys.type] === RoomTypes.commune
                        ? Memory.me
                        : roomToMemory[RoomMemoryKeys.owner] || 'unknown') +
                    ')',
                transaction.resourceType,
                transaction.amount,
                Game.time - transaction.time,
            ])
        }

        const height = 3 + data.length

        Dashboard({
            config: {
                room: room.roomManager.room.name,
            },
            widgets: [
                {
                    pos: {
                        x: 1,
                        y: 1,
                    },
                    width: 47,
                    height,
                    widget: Rectangle({
                        data: Table(() => ({
                            data,
                            config: {
                                label: 'Outgoing Transactions',
                                headers,
                            },
                        })),
                    }),
                },
            ],
        })
    }

    private abandonCommune(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const roomMemory = Memory.rooms[roomName]
        if (!roomMemory) {
            flag.setColor(COLOR_RED)
            return
        }

        if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune) {
            flag.setColor(COLOR_RED)
            return
        }

        flag.remove()
        roomMemory[RoomMemoryKeys.abandonCommune] = true
    }

    private claim(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const roomMemory = Memory.rooms[roomName]
        const communeName = flagNameParts[2] || undefined
        const score = flagNameParts[3] ? parseInt(flagNameParts[3]) : undefined

        if (!roomMemory) {
            flag.setColor(COLOR_RED)
            return
        }
        if (roomMemory[RoomMemoryKeys.communePlanned] !== true) {
            flag.setColor(COLOR_RED)
            return
        }

        if (communeName) {
            const communeMemory = Memory.rooms[communeName]
            if (!communeMemory) {
                flag.setColor(COLOR_RED)
                return
            }
        }

        global.claim(roomName, communeName, score)

        flag.remove()
    }

    private deleteClaim(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const roomMemory = Memory.rooms[roomName]

        if (!roomMemory) {
            flag.setColor(COLOR_RED)
            return
        }

        global.deleteWorkRequest(roomName)

        flag.remove()
    }

    private combat(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const communeName = flagNameParts[2] || undefined
        const type: CombatRequestTypes = (flagNameParts[3] as CombatRequestTypes) || 'attack'

        flag.setColor(COLOR_RED)
        return

        if (communeName) {
            if (!Memory.rooms[communeName]) {
                flag.setColor(COLOR_RED)
                return
            }
        }

        global.combat(roomName, type, undefined, communeName)
    }

    private attack(flagName: string, flagNameParts: string[]) {
        flagNameParts.push('attack')
        this.combat(flagName, flagNameParts)
    }

    private harass(flagName: string, flagNameParts: string[]) {
        flagNameParts.push('harass')
        this.combat(flagName, flagNameParts)
    }

    private defend(flagName: string, flagNameParts: string[]) {
        flagNameParts.push('defend')
        this.combat(flagName, flagNameParts)
    }

    private deleteCombat(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName

        global.deleteCombatRequest(roomName)

        flag.remove()
    }

    private defenceFloodAnchor(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) return

        const anchor = room.roomManager.anchor
        if (!anchor) {
            throw Error('no anchor')
        }

        const terrain = Game.map.getRoomTerrain(room.name)
        const rampartPlans = room.roomManager.rampartPlans
        roomUtils.floodFillFor(room.name, [anchor], coord => {
            // Ignore terrain that protects us
            if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

            const planData = rampartPlans.getXY(coord.x, coord.y)
            if (planData) {
                // Filter out non-mincut ramparts
                if (planData.buildForNuke || planData.coversStructure) {

                    room.coordVisual(coord.x, coord.y)
                    return true
                }

                // Don't flood past mincut ramparts
                return false
            }
            room.coordVisual(coord.x, coord.y)
            // See if there is an enemy creep
            const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
            if (!enemyCreepID) return true

            const enemyCreep = findObjectWithID(enemyCreepID)
            if (isAlly(enemyCreep.name)) return true
            // If it can deal damage, safemode
            if (
                enemyCreep.combatStrength.ranged > 0 ||
                enemyCreep.combatStrength.melee > 0 ||
                enemyCreep.combatStrength.dismantle > 0
            )
                return Result.stop

            return true
        })
    }

    private defenceFloodController(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) return

        const terrain = Game.map.getRoomTerrain(room.name)
        roomUtils.floodFillFor(
            room.name,
            [room.controller.pos],
            (coord, packedCoord, depth) => {
                // See if we should even consider the coord

                // Ignore terrain that protects us
                if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

                // Don't go out of range 2 from controller
                if (depth > 2) return false

                // Ignore structures that protect us
                if (room.coordHasStructureTypes(coord, ourImpassibleStructuresSet)) return false

                // Past this point we should always add this coord to the next generation
                room.coordVisual(coord.x, coord.y)
                // See if there is an enemy creep
                const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
                if (!enemyCreepID) return true

                const enemyCreep = findObjectWithID(enemyCreepID)
                if (isAlly(enemyCreep.name)) return true
                // We only need to protect our controller from claim creeps
                if (!enemyCreep.parts.claim) return true

                // We identified an enemy claimed near our controller!
                return Result.stop
            },
        )
    }
}

export const flagManager = new FlagManager()
