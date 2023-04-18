import { Dashboard, Rectangle, Table } from 'screeps-viz'
import { RoomMemoryKeys, RoomTypes, customColors } from './constants'
import { internationalManager } from './international'

class FlagManager {
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

        const headers: any[] = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

        const data: any[][] = []

        for (const transaction of Game.market.incomingTransactions) {
            const roomFromMemory = Memory.rooms[transaction.from]
            const roomToMemory = Memory.rooms[transaction.to]

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

        const headers: any[] = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

        const data: any[][] = []

        for (const transaction of Game.market.outgoingTransactions) {
            const roomFromMemory = Memory.rooms[transaction.from]
            const roomToMemory = Memory.rooms[transaction.to]

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
        roomMemory[RoomMemoryKeys.abandoned] = true
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
}

export const flagManager = new FlagManager()
