import { roundTo } from 'utils/utils'
import { customColors, RoomMemoryKeys, RoomStatNamesEnum, RoomTypes } from './constants'
import { log, LogTypes } from 'utils/logging'

const remoteStatNames: Set<Partial<RoomCommuneStatNames>> = new Set([
    RoomStatNamesEnum.EnergyStored,
    RoomStatNamesEnum.EnergyInputHarvest,
    RoomStatNamesEnum.EnergyOutputRepairOther,
    RoomStatNamesEnum.EnergyOutputBuild,
])

export class StatsManager {
    stats: {
        [roomType in StatsRoomTypes]: {
            [roomName: string]: Partial<RoomStats | RoomCommuneStats>
        }
    }

    private roomConfig(roomName: string, roomType: number) {
        let roomStats = undefined
        if (roomType === RoomTypes.commune) {
            roomStats = {
                [RoomStatNamesEnum.SpawnUsagePercentage]: 0,
                [RoomStatNamesEnum.EnergyInputHarvest]: 0,
                [RoomStatNamesEnum.CreepCount]: 0,
                [RoomStatNamesEnum.TotalCreepCount]: 0,
                [RoomStatNamesEnum.PowerCreepCount]: 0,
                [RoomStatNamesEnum.ControllerLevel]: 0,
                [RoomStatNamesEnum.EnergyStored]: 0,
                [RoomStatNamesEnum.MineralsHarvested]: 0,
                [RoomStatNamesEnum.EnergyInputBought]: 0,
                [RoomStatNamesEnum.EnergyOutputSold]: 0,
                [RoomStatNamesEnum.EnergyOutputUpgrade]: 0,
                [RoomStatNamesEnum.EnergyOutputBuild]: 0,
                [RoomStatNamesEnum.EnergyOutputRepairOther]: 0,
                [RoomStatNamesEnum.EnergyOutputRepairWallOrRampart]: 0,
                [RoomStatNamesEnum.EnergyOutputSpawn]: 0,
                [RoomStatNamesEnum.EnergyOutputPower]: 0,
                [RoomStatNamesEnum.RemoteCount]: 0,
                [RoomStatNamesEnum.RemoteEnergyStored]: 0,
                [RoomStatNamesEnum.RemoteEnergyInputHarvest]: 0,
                [RoomStatNamesEnum.RemoteEnergyOutputRepairOther]: 0,
                [RoomStatNamesEnum.RemoteEnergyOutputBuild]: 0,
            }

            this.stats[RoomTypes.commune][roomName] = roomStats
            if (!Memory.stats.rooms[roomName]) Memory.stats.rooms[roomName] = roomStats
            return
        }

        roomStats = {
            [RoomStatNamesEnum.RemoteEnergyStored]: 0,
            [RoomStatNamesEnum.RemoteEnergyInputHarvest]: 0,
            [RoomStatNamesEnum.RemoteEnergyOutputRepairOther]: 0,
            [RoomStatNamesEnum.RemoteEnergyOutputBuild]: 0,
        }

        this.stats[RoomTypes.remote][roomName] = roomStats
    }

    roomPreTick(roomName: string, roomType: number) {
        this.roomConfig(roomName, roomType)
    }

    private roomCommuneFinalEndTick(roomName: string, room: Room, forceUpdate: boolean = false) {
        const roomMemory = Memory.rooms[roomName]
        const roomStats = Memory.stats.rooms[roomName]
        const globalCommuneStats = this.stats[RoomTypes.commune][roomName] as RoomCommuneStats

        const each250Ticks = Game.time % 250 === 0

        const remotes = roomMemory[RoomMemoryKeys.remotes]
        for (const remoteRoomName of remotes) {
            const remoteRoomStats = this.stats[RoomTypes.remote][remoteRoomName]
            if (!remoteRoomStats) continue

            globalCommuneStats[RoomStatNamesEnum.RemoteCount] += 1
            globalCommuneStats[RoomStatNamesEnum.RemoteEnergyInputHarvest] +=
                remoteRoomStats[RoomStatNamesEnum.RemoteEnergyInputHarvest]
            globalCommuneStats[RoomStatNamesEnum.RemoteEnergyOutputRepairOther] +=
                remoteRoomStats[RoomStatNamesEnum.RemoteEnergyOutputRepairOther]
            globalCommuneStats[RoomStatNamesEnum.RemoteEnergyOutputBuild] +=
                remoteRoomStats[RoomStatNamesEnum.RemoteEnergyOutputBuild]

            if (each250Ticks) {
                globalCommuneStats[RoomStatNamesEnum.RemoteEnergyStored] +=
                    Game.rooms[remoteRoomName]?.roomManager.resourcesInStoringStructures.energy || 0
            }
        }

        globalCommuneStats[RoomStatNamesEnum.CreepCount] = room.myCreepsAmount
        globalCommuneStats[RoomStatNamesEnum.TotalCreepCount] = room.creepsFromRoomAmount
        globalCommuneStats[RoomStatNamesEnum.PowerCreepCount] = room.myPowerCreepsAmount

        const spawns = room.roomManager.structures.spawn
        if (spawns.length > 0) {
            globalCommuneStats.su =
                spawns.reduce(
                    (sum, spawn) =>
                        sum +
                        ((spawn.spawning && spawn.spawning.remainingTime) ||
                        spawn.renewed ||
                        !spawn.RCLActionable
                            ? 1
                            : 0),
                    0,
                ) / spawns.length
        }

        if (each250Ticks || forceUpdate) {
            if (room.controller && room.controller.my) {
                const progressPercentage = room.controller.progress / room.controller.progressTotal
                globalCommuneStats.cl =
                    progressPercentage < 1
                        ? room.controller.level + progressPercentage
                        : room.controller.level
            }
            globalCommuneStats[RoomStatNamesEnum.EnergyStored] =
                room.roomManager.resourcesInStoringStructures.energy +
                room.roomManager.resourcesInStoringStructures.battery * 10
        } else {
            globalCommuneStats[RoomStatNamesEnum.EnergyStored] =
                roomStats[RoomStatNamesEnum.EnergyStored]
            globalCommuneStats[RoomStatNamesEnum.ControllerLevel] =
                roomStats[RoomStatNamesEnum.ControllerLevel]
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

        for (const name of activeGlobalStatNames) {
            let globalValue = globalCommuneStats[name] || 0
            let value = roomStats[name] || 0

            if (forceUpdate) {
                roomStats[name] = this.average(value, globalValue)
                continue
            }

            roomStats[name] = 0
        }
    }
    internationalConfig() {
        Memory.stats = {
            lastReset: 0,
            tickLength: 0,
            lastTick: 0,
            lastTickTimestamp: 0,
            resources: {
                pixels: 0,
                cpuUnlocks: 0,
                accessKeys: 0,
                credits: 0,
            },
            cpu: {
                bucket: 0,
                usage: Game.cpu.limit,
                limit: 0,
            },
            memory: {
                usage: 0,
                limit: 2097,
            },
            heapUsage: 0,
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
            constructionSites: 0,
            creeps: 0,
        }

        this.stats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
        this.internationalEndTick()
    }

    tickInit() {
        Memory.stats.creeps = 0
        this.stats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
    }

    internationalEndTick() {
        const timestamp = Date.now()

        global.lastReset = (global.lastReset || 0) + 1
        Memory.stats.lastReset = global.lastReset
        Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp
        Memory.stats.lastTickTimestamp = timestamp
        Memory.stats.lastTick = Game.time
        Memory.stats.constructionSites = global.constructionSitesCount || 0

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
        Memory.stats.memory.usage = roundTo(
            Memory.stats.memory.limit / Math.floor(RawMemory.get().length / 1000),
            2,
        )

        const heapStatistics = Game.cpu.getHeapStatistics()
        Memory.stats.heapUsage = roundTo(
            heapStatistics.total_heap_size / heapStatistics.heap_size_limit,
            2,
        )
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

        // Run communes one last time to update stats

        for (const roomName in this.stats[RoomTypes.commune]) {
            this.roomCommuneFinalEndTick(roomName, Game.rooms[roomName])
        }

        // Delete data for rooms that exist in memory but not in our stats

        for (const roomName in Memory.stats.rooms) {
            if (this.stats[RoomTypes.commune][roomName]) continue

            Memory.stats.rooms[roomName] = undefined
        }

        delete this.stats
    }

    average(
        avg: number,
        number: number,
        averagedOverTickCount: number = 1000,
        precision: number = 8,
    ) {
        if (!avg) avg = 0
        if (!number) number = 0

        avg -= avg / averagedOverTickCount
        avg += number / averagedOverTickCount

        return roundTo(avg, precision)
    }

    updateStat(roomName: string, name: string, value: number) {
        if (!this.stats) return

        let roomStatName = name as RoomStatNames

        if (this.stats[RoomTypes.commune][roomName]) {
            ;(this.stats[RoomTypes.commune][roomName] as RoomCommuneStats)[roomStatName] += value
            return
        }

        if (this.stats[RoomTypes.remote][roomName]) {
            if (remoteStatNames.has(roomStatName)) {
                roomStatName = ('r' + roomStatName) as RoomStatNames
            }

            ;(this.stats[RoomTypes.remote][roomName] as RoomStats)[roomStatName] += value
        }
    }
}

export const statsManager = new StatsManager()
