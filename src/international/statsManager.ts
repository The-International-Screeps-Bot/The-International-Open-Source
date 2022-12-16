import { customColors } from './constants'
import { customLog } from './utils'

const CPUUsers: CpuUsers = {
    imcu: 0,
    cocu: 0,
    mvmcu: 0,
    pccu: 0,
    tccu: 0,
    roomcu: 0,
    smcu: 0,
}

function GetLevelOfStatName(statName: RoomCommuneStatNames): number {
    const roomStatsLevel = Memory.roomStats
    switch (statName) {
        case 'su':
        case 'eih':
            if (roomStatsLevel >= 1) return 1
            else return 0
        case 'cc':
        case 'tcc':
        case 'pcc':
        case 'cl':
        case 'bes':
        case 'es':
            if (roomStatsLevel >= 1) return 1.5
            else return 0
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
        case 'res':
        case 'reih':
        case 'reoro':
        case 'reob':
            if (roomStatsLevel >= 2) return 2
            else return 0
        case 'rrvmcu':
        case 'rcmcu':
        case 'rrolmcu':
        case 'retcmcu':
        case 'rprmcu':
        case 'acrmcu':
        case 'clrmcu':
        case 'tmcu':
        case 'smcu':
        case 'cormcu':
        case 'dmcu':
        case 'srmcu':
        case 'rocu':
        case 'rvmcu':
        case 'cmcu':
        case 'rolmcu':
        case 'rolmpccu':
        case 'rrolmpccu':
        case 'etcmcu':
        case 'prmcu':
        case 'prmpccu':
        case 'rprmpccu':
        case 'rrocu':
            if (Memory.CPULogging === true) return 3
            else return 0
        default:
            return 0
    }
}

function GetRemoteStatsName(name: RoomCommuneStatNames): RoomStatNames {
    switch (name) {
        case 'es':
        case 'eih':
        case 'eoro':
        case 'eob':
        case 'rocu':
        case 'rvmcu':
        case 'cmcu':
        case 'rolmcu':
        case 'rolmpccu':
        case 'etcmcu':
        case 'prmcu':
        case 'prmpccu':
            return ('r' + name) as RoomStatNames
        default:
            return name as RoomStatNames
    }
}

export class StatsManager {
    roomConfig(roomName: string, roomType: string) {
        const remoteLevel1: Partial<RoomStats> = {
            res: 0,
            gt: 0,
            reih: 0,
        }
        const remoteLevel2: Partial<RoomStats> = {
            ...remoteLevel1,
            reoro: 0,
            reob: 0,
            res: 0,
        }
        const remoteLevel3: Partial<RoomStats> = {
            rrocu: 0,
            rrvmcu: 0,
            rcmcu: 0,
            rrolmcu: 0,
            rrolmpccu: 0,
            retcmcu: 0,
            rprmcu: 0,
            rprmpccu: 0,
        }

        const communeLevel1: Partial<RoomCommuneStats> = {
            su: 0,
            eih: 0,
            cc: 0,
            tcc: 0,
            pcc: 0,
            cl: 0,
            bes: 0,
            es: 0,
            gt: 0,
        }
        const communeLevel2: Partial<RoomCommuneStats> = {
            ...communeLevel1,
            mh: 0,
            eib: 0,
            eos: 0,
            eou: 0,
            eob: 0,
            eoro: 0,
            eorwr: 0,
            eosp: 0,
            eop: 0,
            rc: 0,
            res: 0,
            reih: 0,
            reoro: 0,
            reob: 0,
        }
        const communeLevel3: Partial<RoomCommuneStats> = {
            rrvmcu: 0,
            rcmcu: 0,
            rrolmcu: 0,
            rolmcu: 0,
            rolmpccu: 0,
            rrolmpccu: 0,
            retcmcu: 0,
            prmcu: 0,
            rprmcu: 0,
            prmpccu: 0,
            rprmpccu: 0,
            acrmcu: 0,
            clrmcu: 0,
            tmcu: 0,
            smcu: 0,
            cormcu: 0,
            dmcu: 0,
            srmcu: 0,
            rocu: 0,
            rvmcu: 0,
            cmcu: 0,
            etcmcu: 0,
        }
        const roomStats = Memory.roomStats
        let stats = undefined
        if (roomType === 'commune') {
            switch (roomStats) {
                case 1:
                    stats = communeLevel1
                    break
                case 2:
                    stats = communeLevel2
                    break
                default:
                    stats = communeLevel1
                    break
            }

            if (Memory.CPULogging === true) {
                stats = {
                    ...stats,
                    ...communeLevel3,
                }
            }

            if (stats) {
                global.roomStats.commune[roomName] = stats
                if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = stats
            }
            return
        }

        switch (roomStats) {
            case 1:
                stats = remoteLevel1
                break
            case 2:
                stats = remoteLevel2
                break
            default:
                stats = remoteLevel1
                break
        }

        if (Memory.CPULogging === true) {
            stats = {
                ...stats,
                ...remoteLevel3,
            }
        }

        if (stats) global.roomStats.remote[roomName] = stats
    }

    roomPreTick(roomName: string, roomType: RoomTypes) {
        this.roomConfig(roomName, roomType)
    }

    roomEndTick(roomName: string, roomType: RoomTypes) {
        if (roomType === 'commune') {
            const globalStats = global.roomStats.commune[roomName] as RoomCommuneStats
            if (globalStats) {
                globalStats.gt = Game.time
            }
        } else if (roomType === 'remote') {
            const globalStats = global.roomStats.remote[roomName] as RoomStats
            if (globalStats) {
                globalStats.gt = Game.time
            }
        }
    }

    roomCommuneFinalEndTick(roomName: string, room?: Room, forceUpdate: boolean = false) {
        const roomMemory = Memory.rooms[roomName]
        const roomStats = Memory.stats.rooms[roomName]
        const globalCommuneStats = global.roomStats.commune[roomName] as RoomCommuneStats

        if (globalCommuneStats.gt !== Game.time && !forceUpdate) {
            customLog('StatsManager', `RoomCommuneFinalEndTick: ${roomName} stats not updated`, {
                textColor: customColors.white,
                bgColor: customColors.red,
            })
            return
        }
        const each250Ticks = Game.time % 250 === 0

        Object.entries(global.roomStats.remote)
            .filter(([roomName]) => roomMemory.remotes.includes(roomName))
            .forEach(([remoteRoomName, remoteRoomStats]) => {
                if (globalCommuneStats.gt === Game.time) {
                    globalCommuneStats.rc += 1
                    globalCommuneStats.reih += remoteRoomStats.reih
                    globalCommuneStats.reoro += remoteRoomStats.reoro
                    globalCommuneStats.reob += remoteRoomStats.reob

                    // CPU
                    if (Memory.CPULogging === true) {
                        globalCommuneStats.rrocu += remoteRoomStats.rrocu
                        globalCommuneStats.rrvmcu += remoteRoomStats.rrvmcu
                        globalCommuneStats.rcmcu += remoteRoomStats.rcmcu
                        globalCommuneStats.rrolmcu += remoteRoomStats.rrolmcu
                        globalCommuneStats.rrolmpccu += remoteRoomStats.rrolmpccu
                        globalCommuneStats.retcmcu += remoteRoomStats.retcmcu
                        globalCommuneStats.rprmcu += remoteRoomStats.rprmcu
                        globalCommuneStats.rprmpccu += remoteRoomStats.rprmpccu
                    }

                    if (each250Ticks)
                        globalCommuneStats.res += Game.rooms[remoteRoomName]?.resourcesInStoringStructures.energy || 0
                }
            })
        if (room) {
            globalCommuneStats.cc = room.myCreepsAmount
            globalCommuneStats.tcc = room.creepsFromRoomAmount
            globalCommuneStats.pcc = room.myPowerCreepsAmount

            const spawns = room.structures.spawn
            if (spawns.length > 0)
                globalCommuneStats.su =
                    spawns.reduce(
                        (sum, spawn) =>
                            sum +
                            ((spawn.spawning && spawn.spawning.remainingTime) || spawn.renewed || !spawn.RCLActionable
                                ? 1
                                : 0),
                        0,
                    ) / spawns.length

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

        const activeGlobalStatNames = Object.keys(globalCommuneStats) as (keyof RoomCommuneStats)[]
        const activeStatNames = Object.keys(roomStats) as (keyof RoomCommuneStats)[]
        const nonActiveStats = activeStatNames.filter(
            stat => !activeGlobalStatNames.includes(stat),
        ) as (keyof RoomCommuneStats)[]

        nonActiveStats.forEach(name => {
            delete globalCommuneStats[name]
            delete roomStats[name]
        })

        activeGlobalStatNames.forEach(name => {
            const statLevel = GetLevelOfStatName(name)
            if (statLevel > 0) {
                let globalValue = globalCommuneStats[name]
                const value = roomStats[name]
                if (!value) roomStats[name] = 0
                if (!globalValue) globalValue = 0

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
                    case 3:
                        if (forceUpdate || Memory.CPULogging === true) {
                            roomStats[name] = this.average(value, globalValue)
                        } else roomStats[name] = 0
                        break
                    default:
                        break
                }
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
            CPUUsers,
        }

        global.roomStats = { commune: {}, remote: {} }
        global.CPUUsers = CPUUsers
        this.internationalEndTick()
    }

    internationalPreTick() {
        global.CPUUsers = CPUUsers
        global.roomStats = { commune: {}, remote: {} }
    }

    internationalEndTick() {
        const managerCPUStart = Game.cpu.getUsed()
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

        Memory.stats.heap = Game.cpu.getHeapStatistics()

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

        if (Memory.CPULogging === true && Memory.stats.CPUUsers !== undefined) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            const CPUUsers = Memory.stats.CPUUsers
            Memory.stats.CPUUsers = {
                cocu: this.average(CPUUsers.cocu, global.CPUUsers.cocu),
                imcu: this.average(CPUUsers.imcu, global.CPUUsers.imcu),
                mvmcu: this.average(CPUUsers.mvmcu, global.CPUUsers.mvmcu),
                pccu: this.average(CPUUsers.pccu, global.CPUUsers.pccu),
                tccu: this.average(CPUUsers.tccu, global.CPUUsers.tccu),
                roomcu: this.average(CPUUsers.roomcu, global.CPUUsers.roomcu),
                smcu: this.average(CPUUsers.smcu, cpuUsed),
            }
            customLog('Stats Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
        } else {
            Memory.stats.CPUUsers = {
                cocu: undefined,
                imcu: undefined,
                mvmcu: undefined,
                pccu: undefined,
                tccu: undefined,
                roomcu: undefined,
                smcu: undefined,
            }
        }
    }

    round(value: number, decimals: number = 8) {
        const multiplier = Math.pow(10, decimals || 0)
        return Math.round(value * multiplier) / multiplier
    }

    average(avg: number, number: number, averagedOverTickCount: number = 1000, precision?: number) {
        if (!avg) avg = 0
        if (!number) number = 0
        avg -= avg / averagedOverTickCount
        avg += number / averagedOverTickCount
        return this.round(avg, precision)
    }
}

export const statsManager = new StatsManager()
export const globalStatsUpdater = function (
    roomName: string,
    name: string,
    value: number,
    nonRoomStat: boolean = false,
) {
    if (nonRoomStat) {
        global.CPUUsers[name as InternationalStatNames] = value
        return
    }
    const roomStatName = name as RoomStatNames
    const updateStats = GetLevelOfStatName(roomStatName) > 0
    if (updateStats && global.roomStats) {
        if (global.roomStats.commune[roomName])
            (global.roomStats.commune[roomName] as RoomCommuneStats)[roomStatName] += value
        else if (global.roomStats.remote[roomName])
            (global.roomStats.remote[roomName] as RoomStats)[GetRemoteStatsName(roomStatName)] += value
    }
}
