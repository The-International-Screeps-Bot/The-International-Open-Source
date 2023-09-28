import { roundTo } from 'utils/utils'
import { CPUMaxPerTick, customColors, RoomMemoryKeys, RoomStatsKeys, RoomTypes } from './constants'
import { customLog, LogTypes } from 'utils/logging'
import { collectiveManager } from './collective'

const remoteStatNames: Set<Partial<RoomCommuneStatNames>> = new Set([
    RoomStatsKeys.EnergyStored,
    RoomStatsKeys.EnergyInputHarvest,
    RoomStatsKeys.EnergyOutputRepairOther,
    RoomStatsKeys.EnergyOutputBuild,
])

/**
 * Names of stats to average for
 */
const averageStatNames: Set<Partial<RoomCommuneStatNames>> = new Set([
    RoomStatsKeys.SpawnUsagePercentage,
    RoomStatsKeys.EnergyInputHarvest,
    RoomStatsKeys.MineralsHarvested,
    RoomStatsKeys.EnergyInputBought,
    RoomStatsKeys.EnergyOutputSold,
    RoomStatsKeys.EnergyOutputUpgrade,
    RoomStatsKeys.EnergyOutputBuild,
    RoomStatsKeys.EnergyOutputRepairOther,
    RoomStatsKeys.EnergyOutputRepairWallOrRampart,
    RoomStatsKeys.EnergyOutputSpawn,
    RoomStatsKeys.EnergyOutputPower,
    RoomStatsKeys.RemoteEnergyStored,
    RoomStatsKeys.RemoteEnergyInputHarvest,
    RoomStatsKeys.RemoteEnergyOutputRepairOther,
    RoomStatsKeys.RemoteEnergyOutputBuild,
])

export class StatsManager {
    stats: {
        [roomType in StatsRoomTypes]: {
            [roomName: string]: Partial<RoomStats | RoomCommuneStats>
        }
    }

    private roomConfig(roomName: string, roomType: number) {
        if (roomType === RoomTypes.commune) {
            const roomStats = (this.stats[RoomTypes.commune][roomName] = {
                [RoomStatsKeys.SpawnUsagePercentage]: 0,
                [RoomStatsKeys.EnergyInputHarvest]: 0,
                [RoomStatsKeys.CreepCount]: 0,
                [RoomStatsKeys.TotalCreepCount]: 0,
                [RoomStatsKeys.PowerCreepCount]: 0,
                [RoomStatsKeys.ControllerLevel]: 0,
                [RoomStatsKeys.EnergyStored]: 0,
                [RoomStatsKeys.MineralsHarvested]: 0,
                [RoomStatsKeys.EnergyInputBought]: 0,
                [RoomStatsKeys.EnergyOutputSold]: 0,
                [RoomStatsKeys.EnergyOutputUpgrade]: 0,
                [RoomStatsKeys.EnergyOutputBuild]: 0,
                [RoomStatsKeys.EnergyOutputRepairOther]: 0,
                [RoomStatsKeys.EnergyOutputRepairWallOrRampart]: 0,
                [RoomStatsKeys.EnergyOutputSpawn]: 0,
                [RoomStatsKeys.EnergyOutputPower]: 0,
                [RoomStatsKeys.RemoteCount]: 0,
                [RoomStatsKeys.RemoteEnergyStored]: 0,
                [RoomStatsKeys.RemoteEnergyInputHarvest]: 0,
                [RoomStatsKeys.RemoteEnergyOutputRepairOther]: 0,
                [RoomStatsKeys.RemoteEnergyOutputBuild]: 0,
            })

            if (Memory.stats.rooms[roomName]) return

            Memory.stats.rooms[roomName] = roomStats
            return
        }

        this.stats[RoomTypes.remote][roomName] = {
            [RoomStatsKeys.RemoteEnergyStored]: 0,
            [RoomStatsKeys.RemoteEnergyInputHarvest]: 0,
            [RoomStatsKeys.RemoteEnergyOutputRepairOther]: 0,
            [RoomStatsKeys.RemoteEnergyOutputBuild]: 0,
        }
    }

    roomPreTick(roomName: string, roomType: number) {
        this.roomConfig(roomName, roomType)
    }

    private roomCommuneFinalEndTick(roomName: string, forceUpdate: boolean = false) {
        const room = Game.rooms[roomName]
        const roomMemory = Memory.rooms[roomName]
        const interTickRoomStats = Memory.stats.rooms[roomName]
        const roomStats = this.stats[RoomTypes.commune][roomName] as RoomCommuneStats

        const each250Ticks = Game.time % 250 === 0

        const remotes = roomMemory[RoomMemoryKeys.remotes]
        for (const remoteRoomName of remotes) {
            const remoteRoomStats = this.stats[RoomTypes.remote][remoteRoomName]
            if (!remoteRoomStats) continue

            roomStats[RoomStatsKeys.RemoteCount] += 1
            roomStats[RoomStatsKeys.RemoteEnergyInputHarvest] +=
                remoteRoomStats[RoomStatsKeys.RemoteEnergyInputHarvest]
            roomStats[RoomStatsKeys.RemoteEnergyOutputRepairOther] +=
                remoteRoomStats[RoomStatsKeys.RemoteEnergyOutputRepairOther]
            roomStats[RoomStatsKeys.RemoteEnergyOutputBuild] +=
                remoteRoomStats[RoomStatsKeys.RemoteEnergyOutputBuild]

            if (each250Ticks) {
                roomStats[RoomStatsKeys.RemoteEnergyStored] += 0
            }
        }

        roomStats[RoomStatsKeys.CreepCount] = room.myCreepsAmount
        roomStats[RoomStatsKeys.TotalCreepCount] = room.creepsFromRoomAmount
        roomStats[RoomStatsKeys.PowerCreepCount] = room.myPowerCreepsAmount

        const spawns = room.roomManager.structures.spawn
        if (spawns.length > 0) {
            let spawningSpawnsCount = 0

            for (const spawn of spawns) {
                if (!spawn.spawning && !spawn.renewed) continue

                spawningSpawnsCount += 1
            }

            roomStats[RoomStatsKeys.SpawnUsagePercentage] = spawningSpawnsCount / spawns.length
        }

        if (room.controller && room.controller.my) {
            const progressPercentage = room.controller.progress / room.controller.progressTotal
            roomStats.cl =
                progressPercentage < 1
                    ? room.controller.level + progressPercentage
                    : room.controller.level
        }

        /*         if (each250Ticks || forceUpdate) {
            const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures
            roomStats[RoomStatNamesEnum.EnergyStored] =
                (resourcesInStoringStructures.energy || 0) +
                (resourcesInStoringStructures.battery || 0) * 10
        } else {
            roomStats[RoomStatNamesEnum.EnergyStored] =
                interTickRoomStats[RoomStatNamesEnum.EnergyStored]
        } */
        const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures
        roomStats[RoomStatsKeys.EnergyStored] =
            (resourcesInStoringStructures.energy || 0) +
            (resourcesInStoringStructures.battery || 0) * 10

        // delete legacy stat key value pairs

        for (const key in interTickRoomStats) {
            const statName = key as keyof RoomCommuneStats
            if (roomStats[statName]) continue

            roomStats[statName] = undefined
        }

        // implement average tick stats into inter tick stats

        for (const key in roomStats) {
            const statName = key as keyof RoomCommuneStats

            if (averageStatNames.has(statName)) {
                let globalValue = roomStats[statName] || 0
                let value = interTickRoomStats[statName] || 0

                interTickRoomStats[statName] = this.average(value, globalValue)
                continue
            }

            interTickRoomStats[statName] = roomStats[statName]
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
            powerCreeps: 0,
        }

        this.stats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
        this.internationalEndTick()
    }

    tickInit() {
        this.stats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
    }

    internationalEndTick() {
        // Run communes one last time to update stats

        for (const roomName in this.stats[RoomTypes.commune]) {
            if (!collectiveManager.communes.has(roomName)) {
                Memory.stats.rooms[roomName] = undefined
            }

            this.roomCommuneFinalEndTick(roomName)
        }

        const timestamp = Date.now()

        global.lastReset = (global.lastReset || 0) + 1
        Memory.stats.lastReset = global.lastReset
        Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp
        Memory.stats.lastTickTimestamp = timestamp
        Memory.stats.constructionSites = collectiveManager.constructionSiteCount || 0

        Memory.stats.resources = {
            pixels: Game.resources[PIXEL],
            cpuUnlocks: Game.resources[CPU_UNLOCK],
            accessKeys: Game.resources[ACCESS_KEY],
            credits: Game.market.credits,
        }

        Memory.stats.memory.usage = roundTo(
            Math.floor(RawMemory.get().length / 1000) / Memory.stats.memory.limit,
            8,
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
        Memory.stats.creeps = collectiveManager.creepCount
        Memory.stats.powerCreeps = collectiveManager.powerCreepCount

        // If the code wasn't ran or was properly ran last tick, assign cpu as normal. Otherwise assume we ran out of cpu
        let usedCPU =
            Memory.stats.lastTick === undefined || Memory.stats.lastTick + 1 === Game.time
                ? Game.cpu.getUsed()
                : CPUMaxPerTick

        Memory.stats.cpu = {
            bucket: Game.cpu.bucket,
            limit: Game.cpu.limit,
            usage: this.average(Memory.stats.cpu.usage, usedCPU),
        }

        // Make sure this runs last
        Memory.stats.lastTick = Game.time

        this.stats = undefined
    }

    private average(
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
