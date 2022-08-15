import { roomTypesUsedForStats } from './constants'
export class StatsManager {
    roomConfig(roomName: string, roomType: string) {
        if (roomType === 'commune') {
            const communeStats: RoomStats = {
                cl: 0,
                eih: 0,
                eiet: 0,
                eib: 0,
                eou: 0,
                eoro: 0,
                eorwr: 0,
                eob: 0,
                eoso: 0,
                eosp: 0,
                mh: 0,
                es: 0,
                cc: 0,
                cu: -1,
                rt: 0,
                su: 0,
            }

            global.roomStats[roomName] = communeStats
            if (!Memory.stats.rooms[roomType][roomName]) Memory.stats.rooms[roomType][roomName] = communeStats
            return
        }

        const remoteStats: RoomStats = {
            eih: 0,
            eoro: 0,
            eob: 0,
            es: 0,
            cc: 0,
            cu: -1,
            rt: 1,
        }

        global.roomStats[roomName] = remoteStats
        if (!Memory.stats.rooms.remote[roomName]) Memory.stats.rooms.remote[roomName] = remoteStats
    }

    roomPreTick(roomName: string, roomType: string) {
        this.roomConfig(roomName, roomType)

        global.roomStats[roomName].cu = Game.cpu.getUsed()
    }

    roomEndTick(roomName: string, roomType: 'commune' | 'remote', room?: Room) {
        const roomStats = Memory.stats.rooms[roomType][roomName]
        const globalStats = global.roomStats[roomName]

        if (roomType === 'commune') {
            let spawnUsage = 0
            if (room) {
                roomStats.cc = room.myCreepsAmount

                const spawns = room.structures.spawn

                if (spawns.length > 0)
                    spawnUsage =
                        spawns.reduce((sum, spawn) => sum + (spawn.spawning !== null ? 1 : 0), 0) / spawns.length
            }
            roomStats.su = this.average(roomStats.su, spawnUsage, 500)
        }

        if (Game.time % 250 === 0 && room) {
            if (roomType === 'commune') {
                roomStats.cl =
                    room.controller && room.controller.owner && room.controller.owner.username === Memory.me
                        ? this.round(
                              room.controller.level + room.controller.progress / room.controller.progressTotal,
                              2,
                          )
                        : undefined
                roomStats.es = room.findStoredResourceAmount(RESOURCE_ENERGY)
            }
        }

        if (Memory.roomStats >= 2) {
            roomStats.mh = this.average(roomStats.mh, globalStats.mh, 500)
            if (roomType === 'commune') {
                // roomStats.eib = this.average(roomStats.eib, globalStats.eib, 500)
                // roomStats.eoso = this.average(roomStats.eoso, globalStats.eoso, 500)

                // roomStats.eiet = this.average(roomStats.eiet, globalStats.eiet, 500)
                roomStats.eou = this.round(this.average(roomStats.eou, globalStats.eou, 500), 2)
                roomStats.eorwr = this.round(this.average(roomStats.eorwr, globalStats.eorwr, 500), 2)
                roomStats.eosp = this.round(this.average(roomStats.eosp, globalStats.eosp, 500), 2)
            }
            roomStats.eih = this.round(this.average(roomStats.eih, globalStats.eih, 500), 2)

            roomStats.eob = this.round(this.average(roomStats.eob, globalStats.eob, 500), 2)
            roomStats.eoro = this.round(this.average(roomStats.eoro, globalStats.eoro, 500), 2)
        }

        roomStats.cu = this.round(
            this.average(roomStats.cu, globalStats.cu >= 0 ? Game.cpu.getUsed() - globalStats.cu : 0, 500),
        )
    }

    internationalConfig() {
        Memory.stats = {
            lastReset: 0,
            tickLength: 0,
            lastTickTimestamp: 0,
            resources: {
                pixels: 0,
                cpuUnlocks: 0,
                accessKeys: 0,
                credits: 0,
            },
            cpu: {
                bucket: 0,
                usage: 0,
                limit: 0,
            },
            memory: {
                usage: 0,
                limit: 2097,
            },
            gcl: {
                level: 0,
                progress: 0,
                progressTotal: 0,
            },
            gpl: {
                level: 0,
                progress: 0,
                progressTotal: 0,
            },
            rooms: { commune: {}, remote: {} },
            constructionSiteCount: 0,
        }

        global.roomStats = {}
        this.internationalEndTick()
    }

    internationalPreTick() {
        global.roomStats = {}
    }

    internationalEndTick() {
        Memory.stats.lastReset = (Memory.stats.lastReset || 0) + 1
        const timestamp = Date.now()
        Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp
        Memory.stats.lastTickTimestamp = timestamp
        Memory.stats.constructionSiteCount = global.constructionSitesCount || 0

        Memory.stats.resources = {
            pixels: Game.resources[PIXEL],
            cpuUnlocks: Game.resources[CPU_UNLOCK],
            accessKeys: Game.resources[ACCESS_KEY],
            credits: Game.market.credits,
        }
        Memory.stats.cpu = {
            bucket: Game.cpu.bucket,
            limit: Game.cpu.limit,
            usage: this.round(this.average(Memory.stats.cpu.usage, Game.cpu.getUsed(), 500)),
        }
        Memory.stats.memory.usage = Math.floor(RawMemory.get().length / 1000)
        Memory.stats.gcl = {
            progress: Game.gcl.progress,
            progressTotal: Game.gcl.progressTotal,
            level: Game.gcl.level,
        }
        Memory.stats.gpl = {
            progress: Game.gpl.progress,
            progressTotal: Game.gpl.progressTotal,
            level: Game.gpl.level,
        }

        const globalRoomKeys = Object.keys(global.roomStats)
        const notCheckedCommuneRooms = Object.entries(Memory.stats.rooms.commune).filter(
            vk => !globalRoomKeys.find(k => k == vk[0]),
        )
        const notCheckedRemoteRooms = Object.entries(Memory.stats.rooms.remote).filter(
            vk => !globalRoomKeys.find(k => k == vk[0]),
        )
        notCheckedCommuneRooms.concat(notCheckedRemoteRooms).forEach(missingRoomData => {
            const roomType = Memory.rooms[missingRoomData[0]].type
            if (!roomTypesUsedForStats.includes(roomType)) {
                delete Memory.stats.rooms.commune[missingRoomData[0]]
                delete Memory.stats.rooms.remote[missingRoomData[0]]
                delete global.roomStats[missingRoomData[0]]
            } else {
                this.roomConfig(missingRoomData[0], roomType)
                this.roomEndTick(missingRoomData[0], roomType as 'commune' | 'remote')
            }
        })
        delete global.roomStats
    }

    average(originalNumber: number, newNumber: number, averagedOverTickCount: number) {
        const newWeight = 1 / averagedOverTickCount
        const originalWeight = 1 - newWeight

        return originalNumber * originalWeight + newNumber * newWeight
    }
    round(number: number, digits: number = 5) {
        return parseFloat(number.toFixed(digits))
    }
}

export const statsManager = new StatsManager()
