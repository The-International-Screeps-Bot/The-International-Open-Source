export class StatsManager {
    roomConfig(roomName: string, roomType: string) {
        if (roomType === 'commune') {
            const communeStats: RoomCommuneStats = {
                cl: 0,
                eib: 0,
                eih: 0,
                eou: 0,
                eoro: 0,
                eorwr: 0,
                eob: 0,
                eos: 0,
                eosp: 0,
                mh: 0,
                es: 0,
                cc: 0,
                cu: Game.cpu.getUsed(),
                su: 0,
                tcc: 0,
                rc: 0,
                rcu: 0,
                res: 0,
                reih: 0,
                reoro: 0,
                reob: 0,
            }

            global.roomStats.commune[roomName] = communeStats
            if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = communeStats
            return
        }

        const remoteStats: RoomStats = {
            rc: 0,
            rcu: Game.cpu.getUsed(),
            res: 0,
            reih: 0,
            reoro: 0,
            reob: 0,
        }

        global.roomStats.remote[roomName] = remoteStats
    }

    roomPreTick(roomName: string, roomType: RoomTypes) {
        this.roomConfig(roomName, roomType)
    }

    roomEndTick(roomName: string, roomType: RoomTypes) {
        if (roomType === 'commune') {
            const globalStats = global.roomStats.commune[roomName] as RoomCommuneStats
            globalStats.cu = globalStats.cu >= 0 ? Game.cpu.getUsed() - globalStats.cu : 0
        } else if (roomType === 'remote') {
            const globalStats = global.roomStats.remote[roomName] as RoomStats
            globalStats.rcu = globalStats.rcu >= 0 ? Game.cpu.getUsed() - globalStats.rcu : 0
        }
    }

    roomCommuneFinalEndTick(roomName: string, room?: Room) {
        const roomMemory = Memory.rooms[roomName]
        const roomStats = Memory.stats.rooms[roomName]
        const globalCommuneStats = global.roomStats.commune[roomName] as RoomCommuneStats
        const allGlobalRemoteStats = Object.entries(global.roomStats.remote).filter(([roomName]) =>
            roomMemory.remotes.includes(roomName),
        )
        let spawnUsage = 0

        roomStats.cu = this.average(roomStats.cu, globalCommuneStats.cu >= 0 ? globalCommuneStats.cu : 0)
        if (room) {
            roomStats.cc = room.myCreepsAmount
            roomStats.tcc = room.creepsFromRoomAmount

            const spawns = room.structures.spawn
            if (spawns.length > 0)
                spawnUsage = spawns.reduce((sum, spawn) => sum + (spawn.spawning !== null ? 1 : 0), 0) / spawns.length
        } else {
            roomStats.cc = 0
            roomStats.tcc = 0
        }
        roomStats.su = this.average(roomStats.su, spawnUsage)

        if (Game.time % 250 === 0 && room) {
            if (room.controller && room.controller.my) {
                const progressPercentage = room.controller.progress / room.controller.progressTotal
                roomStats.cl =
                    progressPercentage < 1 ? room.controller.level + progressPercentage : room.controller.level
            } else roomStats.cl = null
            roomStats.es = room.findStoredResourceAmount(RESOURCE_ENERGY)
        }

        roomStats.eih = this.average(roomStats.eih, globalCommuneStats.eih)
        if (Memory.roomStats >= 2) {
            roomStats.mh = this.average(roomStats.mh, globalCommuneStats.mh)
            roomStats.eib = this.average(roomStats.eib, globalCommuneStats.eib)
            roomStats.eos = this.average(roomStats.eos, globalCommuneStats.eos)

            roomStats.eou = this.average(roomStats.eou, globalCommuneStats.eou)
            roomStats.eob = this.average(roomStats.eob, globalCommuneStats.eob)
            roomStats.eoro = this.average(roomStats.eoro, globalCommuneStats.eoro)
            roomStats.eorwr = this.average(roomStats.eorwr, globalCommuneStats.eorwr)
            roomStats.eosp = this.average(roomStats.eosp, globalCommuneStats.eosp)

            allGlobalRemoteStats.forEach(([remoteRoomName, remoteRoomStats]) => {
                globalCommuneStats.rc += 1
                globalCommuneStats.rcu += remoteRoomStats.rcu
                globalCommuneStats.res += remoteRoomStats.res
                globalCommuneStats.reih += remoteRoomStats.reih
                globalCommuneStats.reoro += remoteRoomStats.reoro
                globalCommuneStats.reob += remoteRoomStats.reob
            })
            roomStats.rc = this.average(globalCommuneStats.rc, roomStats.rc)
            roomStats.rcu = this.average(globalCommuneStats.rcu, roomStats.rcu)
            roomStats.res = this.average(globalCommuneStats.res, roomStats.res)
            roomStats.reih = this.average(globalCommuneStats.reih, roomStats.reih)
            roomStats.reoro = this.average(globalCommuneStats.reoro, roomStats.reoro)
            roomStats.reob = this.average(globalCommuneStats.reob, roomStats.reob)
        }
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
            rooms: {},
            constructionSiteCount: 0,
        }

        global.roomStats = { commune: {}, remote: {} }
        this.internationalEndTick()
    }

    internationalPreTick() {
        global.roomStats = { commune: {}, remote: {} }
    }

    internationalEndTick() {
        const timestamp = Date.now()

        global.lastReset = (global.lastReset || 0) + 1
        Memory.stats.lastReset = global.lastReset
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
            usage: this.average(Memory.stats.cpu.usage, Game.cpu.getUsed()),
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

        const globalRoomKeys = Object.keys(global.roomStats.commune)
        const notCheckedCommuneRooms = Object.keys(Memory.stats.rooms).filter(room => !globalRoomKeys.includes(room))
        globalRoomKeys.forEach(roomName => {
            this.roomCommuneFinalEndTick(roomName, Game.rooms[roomName])
        })

        notCheckedCommuneRooms.forEach(roomName => {
            const roomType = Memory.rooms[roomName].T
            if (roomType === 'commune') {
                this.roomConfig(roomName, roomType)
                this.roomCommuneFinalEndTick(roomName, Game.rooms[roomName])
            } else {
                delete Memory.stats.rooms[roomName]
            }
        })
        delete global.roomStats
    }

    average(originalNumber: number, newNumber: number, averagedOverTickCount: number = 500, digits: number = 5) {
        const newWeight = 1 / averagedOverTickCount
        const originalWeight = 1 - newWeight

        const originalNumberResult = originalNumber * originalWeight
        const newNumberResult = newNumber * newWeight
        const result = (originalNumberResult || 0) + (newNumberResult || 0)
        return parseFloat(result.toFixed(digits))
    }
}

export const statsManager = new StatsManager()
