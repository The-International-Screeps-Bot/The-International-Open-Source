import { myColors } from './constants'
import { customLog } from './utils'

function GetLevelOfStatName(statName: string, forceUpdate: boolean): number {
    const roomStatsLevel = Memory.roomStats
    switch (statName) {
        case 'su':
        case 'cu':
        case 'eih':
            if (roomStatsLevel >= 1 || forceUpdate) return 1
        case 'cc':
        case 'tcc':
        case 'cl':
        case 'bes':
        case 'es':
            if (roomStatsLevel >= 1 || forceUpdate) return 1.5
        case 'mh':
        case 'eib':
        case 'eos':
        case 'eou':
        case 'eob':
        case 'eoro':
        case 'eorwr':
        case 'eosp':
        case 'eop':
        case 'rc':
        case 'rcu':
        case 'res':
        case 'reih':
        case 'reoro':
        case 'reob':
            if (roomStatsLevel >= 2 || forceUpdate) return 2
            else return 0
        default:
            return 0
    }
}

function GetRemoteStatsName(name: string): string {
    switch (name) {
        case 'cu':
        case 'es':
        case 'eih':
        case 'eoro':
        case 'eob':
            return 'r' + name
        default:
            return name
    }
}

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
                eop: 0,
                mh: 0,
                bes: 0,
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
                gt: 0,
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
            gt: 0,
        }

        global.roomStats.remote[roomName] = remoteStats
    }

    roomPreTick(roomName: string, roomType: RoomTypes) {
        this.roomConfig(roomName, roomType)
    }

    roomEndTick(roomName: string, roomType: RoomTypes) {
        if (roomType === 'commune') {
            const globalStats = global.roomStats.commune[roomName] as RoomCommuneStats
            if (globalStats) {
                globalStats.cu = Game.cpu.getUsed() - globalStats.cu
                globalStats.gt = Game.time
            }
        } else if (roomType === 'remote') {
            const globalStats = global.roomStats.remote[roomName] as RoomStats
            if (globalStats) {
                globalStats.rcu = Game.cpu.getUsed() - globalStats.rcu
                globalStats.gt = Game.time
            }
        }
    }

    roomCommuneFinalEndTick(roomName: string, room?: Room, forceUpdate: boolean = false) {
        const roomMemory = Memory.rooms[roomName]
        const roomStats = Memory.stats.rooms[roomName]
        const globalCommuneStats = global.roomStats.commune[roomName] as RoomCommuneStats

        if (globalCommuneStats.gt !== Game.time && !forceUpdate) {
            customLog(
                'StatsManager',
                `RoomCommuneFinalEndTick: ${roomName} stats not updated`,
                myColors.white,
                myColors.red,
            )
            return
        }
        const each250Ticks = Game.time % 250 === 0

        Object.entries(global.roomStats.remote)
            .filter(([roomName]) => roomMemory.remotes.includes(roomName))
            .forEach(([remoteRoomName, remoteRoomStats]) => {
                if (globalCommuneStats.gt === Game.time) {
                    globalCommuneStats.rc += 1
                    globalCommuneStats.rcu += remoteRoomStats.rcu
                    globalCommuneStats.reih += remoteRoomStats.reih
                    globalCommuneStats.reoro += remoteRoomStats.reoro
                    globalCommuneStats.reob += remoteRoomStats.reob
                    if (each250Ticks)
                        globalCommuneStats.res +=
                            Game.rooms[remoteRoomName]?.resourcesInStoringStructures.energy || 0
                }
            })
        if (room) {
            globalCommuneStats.cc = room.myCreepsAmount
            globalCommuneStats.tcc = room.creepsFromRoomAmount

            const spawns = room.structures.spawn
            if (spawns.length > 0)
                globalCommuneStats.su =
                    spawns.reduce((sum, spawn) => sum + (spawn.spawning !== null ? 1 : 0), 0) / spawns.length

            if (each250Ticks || forceUpdate) {
                if (room.controller && room.controller.my) {
                    const progressPercentage = room.controller.progress / room.controller.progressTotal
                    globalCommuneStats.cl =
                        progressPercentage < 1 ? room.controller.level + progressPercentage : room.controller.level
                }
                globalCommuneStats.es = room.resourcesInStoringStructures.energy
                globalCommuneStats.bes = room.resourcesInStoringStructures.battery * 10
            } else {
                globalCommuneStats.es = roomStats.es
                globalCommuneStats.bes = roomStats.bes
                globalCommuneStats.cl = roomStats.cl
            }
        }

        Object.keys(globalCommuneStats).forEach(name => {
            let globalValue = globalCommuneStats[name]
            const value = roomStats[name]
            if (!value) roomStats[name] = 0
            if (!globalValue) globalValue = 0

            const statLevel = GetLevelOfStatName(name, forceUpdate)
            switch (statLevel) {
                // level 1 w average
                case 1:
                    roomStats[name] = this.average(value, globalValue)
                    break
                // level 1 wo average
                case 1.5:
                    roomStats[name] = this.round(globalValue)
                    break
                // level 2 w average
                case 2:
                    if (forceUpdate || (Memory.roomStats && Memory.roomStats >= 2))
                        roomStats[name] = this.average(value, globalValue)
                    else roomStats[name] = 0
                    break
                default:
                    break
            }
        })
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
                this.roomCommuneFinalEndTick(roomName, Game.rooms[roomName], true)
            } else {
                delete Memory.stats.rooms[roomName]
            }
        })
        delete global.roomStats
    }

    round(value: number, decimals: number = 8) {
        const multiplier = Math.pow(10, decimals || 0)
        return Math.round(value * multiplier) / multiplier
    }

    average(avg: number, number: number, averagedOverTickCount: number = 1000, precision?: number) {
        avg -= avg / averagedOverTickCount
        avg += number / averagedOverTickCount
        return this.round(avg, precision)
    }
}

export const statsManager = new StatsManager()
export const globalStatsUpdater = function (roomName: string, name: string, value: number) {
    const updateStats = GetLevelOfStatName(name, true) > 0
    if (updateStats && global.roomStats) {
        if (global.roomStats.commune[roomName]) global.roomStats.commune[roomName][name] += value
        else if (global.roomStats.remote[roomName]) global.roomStats.remote[roomName][GetRemoteStatsName(name)] += value
    }
}
