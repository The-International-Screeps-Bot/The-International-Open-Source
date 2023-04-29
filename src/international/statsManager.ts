import { customColors, InternationalStatNamesEnum, RoomMemoryKeys, RoomStatNamesEnum, RoomTypes } from './constants'
import { customLog } from './utils'

const CPUUsers: CpuUsers = {
    [InternationalStatNamesEnum.InternationalManagerCPUUsage]: 0,
    [InternationalStatNamesEnum.CreepOrganizerCPUUsage]: 0,
    [InternationalStatNamesEnum.MapVisualsManangerCPUUsage]: 0,
    [InternationalStatNamesEnum.PowerCreepOrganizerCPUUsage]: 0,
    [InternationalStatNamesEnum.TickConfigCPUUsage]: 0,
    [InternationalStatNamesEnum.RoomManagerCPUUsage]: 0,
    [InternationalStatNamesEnum.StatsManagerCPUUsage]: 0,
}

function GetLevelOfStatName(statName: RoomCommuneStatNames): number {
    const roomStatsLevel = Memory.roomStats
    switch (statName) {
        case RoomStatNamesEnum.SpawnUsagePercentage:
        case RoomStatNamesEnum.EnergyInputHarvest:
            if (roomStatsLevel >= 1) return 1
            else return 0
        case RoomStatNamesEnum.CreepCount:
        case RoomStatNamesEnum.TotalCreepCount:
        case RoomStatNamesEnum.PowerCreepCount:
        case RoomStatNamesEnum.ControllerLevel:
        case RoomStatNamesEnum.BatteriesStoredTimes10:
        case RoomStatNamesEnum.EnergyStored:
            if (roomStatsLevel >= 1) return 1.5
            else return 0
        case RoomStatNamesEnum.MineralsHarvested:
        case RoomStatNamesEnum.EnergyInputBought:
        case RoomStatNamesEnum.EnergyOutputSold:
        case RoomStatNamesEnum.EnergyOutputUpgrade:
        case RoomStatNamesEnum.EnergyOutputBuild:
        case RoomStatNamesEnum.EnergyOutputRepairOther:
        case RoomStatNamesEnum.EnergyOutputRepairWallOrRampart:
        case RoomStatNamesEnum.EnergyOutputSpawn:
        case RoomStatNamesEnum.EnergyOutputPower:
        case RoomStatNamesEnum.RemoteCount:
        case RoomStatNamesEnum.RemoteEnergyStored:
        case RoomStatNamesEnum.RemoteEnergyInputHarvest:
        case RoomStatNamesEnum.RemoteEnergyOutputRepairOther:
        case RoomStatNamesEnum.RemoteEnergyOutputBuild:
            if (roomStatsLevel >= 2) return 2
            else return 0
        case RoomStatNamesEnum.RemoteRoomVisualsManagerCPUUsage:
        case RoomStatNamesEnum.RemoteConstructionManagerCPUUsage:
        case RoomStatNamesEnum.RemoteEndTickCreepManagerCPUUsage:
        case RoomStatNamesEnum.RemotePowerRoleManangerCPUUsage:
        case RoomStatNamesEnum.AllyCreepRequestManangerCPUUsage:
        case RoomStatNamesEnum.WorkRequestManagerCPUUsage:
        case RoomStatNamesEnum.TowerManagerCPUUsage:
        case RoomStatNamesEnum.SpawnManagerCPUUsage:
        case RoomStatNamesEnum.CombatRequestManagerCPUUsage:
        case RoomStatNamesEnum.DefenceManagerCPUUsage:
        case RoomStatNamesEnum.SpawnRequestsManagerCPUUsage:
        case RoomStatNamesEnum.RoomCPUUsage:
        case RoomStatNamesEnum.RoomVisualsManagerCPUUsage:
        case RoomStatNamesEnum.ConstructionManagerCPUUsage:
        case RoomStatNamesEnum.RoleManagerCPUUsage:
        case RoomStatNamesEnum.RoleManagerPerCreepCPUUsage:
        case RoomStatNamesEnum.RemoteRoleManagerPerCreepCPUUsage:
        case RoomStatNamesEnum.EndTickCreepManagerCPUUsage:
        case RoomStatNamesEnum.PowerRoleManagerCPUUsage:
        case RoomStatNamesEnum.RemotePowerRoleManagerPerCreepCPUUsage:
        case RoomStatNamesEnum.RemoteRoomCPUUsage:
            if (Memory.CPULogging === true) return 3
            else return 0
        default:
            return 0
    }
}

function GetRemoteStatsName(name: RoomCommuneStatNames): RoomStatNames {
    switch (name) {
        case RoomStatNamesEnum.EnergyStored:
        case RoomStatNamesEnum.EnergyInputHarvest:
        case RoomStatNamesEnum.EnergyOutputRepairOther:
        case RoomStatNamesEnum.EnergyOutputBuild:
        case RoomStatNamesEnum.RoomCPUUsage:
        case RoomStatNamesEnum.RoomVisualsManagerCPUUsage:
        case RoomStatNamesEnum.ConstructionManagerCPUUsage:
        case RoomStatNamesEnum.RoleManagerPerCreepCPUUsage:
        case RoomStatNamesEnum.EndTickCreepManagerCPUUsage:
        case RoomStatNamesEnum.PowerRoleManagerCPUUsage:
        case RoomStatNamesEnum.PowerRoleManagerCPUUsage:
            return ('r' + name) as RoomStatNames
        default:
            return name as RoomStatNames
    }
}

export class StatsManager {
    roomConfig(roomName: string, roomType: number) {
        const remoteLevel1: Partial<RoomStats> = {
            [RoomStatNamesEnum.RemoteEnergyStored]: 0,
            [RoomStatNamesEnum.GameTime]: 0,
            [RoomStatNamesEnum.RemoteEnergyInputHarvest]: 0,
        }
        const remoteLevel2: Partial<RoomStats> = {
            ...remoteLevel1,
            [RoomStatNamesEnum.RemoteEnergyOutputRepairOther]: 0,
            [RoomStatNamesEnum.RemoteEnergyOutputBuild]: 0,
            [RoomStatNamesEnum.RemoteEnergyStored]: 0,
        }
        const remoteLevel3: Partial<RoomStats> = {
            [RoomStatNamesEnum.RemoteRoomCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoomVisualsManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoomCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteConstructionManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoleManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoleManagerPerCreepCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteEndTickCreepManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemotePowerRoleManangerCPUUsage]: 0,
            [RoomStatNamesEnum.RemotePowerRoleManagerPerCreepCPUUsage]: 0,
        }

        const communeLevel1: Partial<RoomCommuneStats> = {
            [RoomStatNamesEnum.SpawnUsagePercentage]: 0,
            [RoomStatNamesEnum.EnergyInputHarvest]: 0,
            [RoomStatNamesEnum.CreepCount]: 0,
            [RoomStatNamesEnum.TotalCreepCount]: 0,
            [RoomStatNamesEnum.PowerCreepCount]: 0,
            [RoomStatNamesEnum.ControllerLevel]: 0,
            [RoomStatNamesEnum.BatteriesStoredTimes10]: 0,
            [RoomStatNamesEnum.EnergyStored]: 0,
            [RoomStatNamesEnum.GameTime]: 0,
        }
        const communeLevel2: Partial<RoomCommuneStats> = {
            ...communeLevel1,
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
        const communeLevel3: Partial<RoomCommuneStats> = {
            [RoomStatNamesEnum.RemoteRoomVisualsManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteConstructionManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoleManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RoleManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RoleManagerPerCreepCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteRoleManagerPerCreepCPUUsage]: 0,
            [RoomStatNamesEnum.RemoteEndTickCreepManagerCPUUsage]: 0,
            [RoomStatNamesEnum.PowerRoleManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RemotePowerRoleManangerCPUUsage]: 0,
            [RoomStatNamesEnum.PowerRoleManagerPerCreepCPUUsage]: 0,
            [RoomStatNamesEnum.RemotePowerRoleManagerPerCreepCPUUsage]: 0,
            [RoomStatNamesEnum.AllyCreepRequestManangerCPUUsage]: 0,
            [RoomStatNamesEnum.WorkRequestManagerCPUUsage]: 0,
            [RoomStatNamesEnum.TowerManagerCPUUsage]: 0,
            [RoomStatNamesEnum.SpawnManagerCPUUsage]: 0,
            [RoomStatNamesEnum.CombatRequestManagerCPUUsage]: 0,
            [RoomStatNamesEnum.DefenceManagerCPUUsage]: 0,
            [RoomStatNamesEnum.SpawnRequestsManagerCPUUsage]: 0,
            [RoomStatNamesEnum.RoomCPUUsage]: 0,
            [RoomStatNamesEnum.RoomVisualsManagerCPUUsage]: 0,
            [RoomStatNamesEnum.ConstructionManagerCPUUsage]: 0,
            [RoomStatNamesEnum.EndTickCreepManagerCPUUsage]: 0,
        }
        const roomStats = Memory.roomStats
        let stats = undefined
        if (roomType === RoomTypes.commune) {
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
                global.roomStats[RoomTypes.commune][roomName] = stats
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

        if (stats) global.roomStats[RoomTypes.remote][roomName] = stats
    }

    roomPreTick(roomName: string, roomType: number) {
        this.roomConfig(roomName, roomType)
    }

    roomEndTick(roomName: string, roomType: number) {
        if (roomType === RoomTypes.commune) {
            const globalStats = global.roomStats[RoomTypes.commune][roomName] as RoomCommuneStats
            if (globalStats) {
                globalStats[RoomStatNamesEnum.GameTime] = Game.time
            }
        } else if (roomType === RoomTypes.remote) {
            const globalStats = global.roomStats[RoomTypes.remote][roomName] as RoomStats
            if (globalStats) {
                globalStats[RoomStatNamesEnum.GameTime] = Game.time
            }
        }
    }

    roomCommuneFinalEndTick(roomName: string, room?: Room, forceUpdate: boolean = false) {
        const roomMemory = Memory.rooms[roomName]
        const roomStats = Memory.stats.rooms[roomName]
        const globalCommuneStats = global.roomStats[RoomTypes.commune][roomName] as RoomCommuneStats

        if (globalCommuneStats.gt !== Game.time && !forceUpdate) {
            customLog('StatsManager', `RoomCommuneFinalEndTick: ${roomName} stats not updated`, {
                textColor: customColors.white,
                bgColor: customColors.red,
            })
            return
        }
        const each250Ticks = Game.time % 250 === 0

        Object.entries(global.roomStats[RoomTypes.remote])
            .filter(([roomName]) => roomMemory[RoomMemoryKeys.remotes].includes(roomName))
            .forEach(([remoteRoomName, remoteRoomStats]) => {
                if (globalCommuneStats[RoomStatNamesEnum.GameTime] === Game.time) {
                    globalCommuneStats[RoomStatNamesEnum.RemoteCount] += 1
                    globalCommuneStats[RoomStatNamesEnum.RemoteEnergyInputHarvest] +=
                        remoteRoomStats[RoomStatNamesEnum.RemoteEnergyInputHarvest]
                    globalCommuneStats[RoomStatNamesEnum.RemoteEnergyOutputRepairOther] +=
                        remoteRoomStats[RoomStatNamesEnum.RemoteEnergyOutputRepairOther]
                    globalCommuneStats[RoomStatNamesEnum.RemoteEnergyOutputBuild] +=
                        remoteRoomStats[RoomStatNamesEnum.RemoteEnergyOutputBuild]

                    // CPU
                    if (Memory.CPULogging === true) {
                        globalCommuneStats[RoomStatNamesEnum.RemoteRoomCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteRoomCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemoteRoomVisualsManagerCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteRoomVisualsManagerCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemoteConstructionManagerCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteConstructionManagerCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemoteRoleManagerCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteRoleManagerCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemoteRoleManagerPerCreepCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteRoleManagerPerCreepCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemoteEndTickCreepManagerCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemoteEndTickCreepManagerCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemotePowerRoleManangerCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemotePowerRoleManangerCPUUsage]
                        globalCommuneStats[RoomStatNamesEnum.RemotePowerRoleManagerPerCreepCPUUsage] +=
                            remoteRoomStats[RoomStatNamesEnum.RemotePowerRoleManagerPerCreepCPUUsage]
                    }

                    if (each250Ticks)
                        globalCommuneStats[RoomStatNamesEnum.RemoteEnergyStored] +=
                            Game.rooms[remoteRoomName]?.resourcesInStoringStructures.energy || 0
                }
            })
        if (room) {
            globalCommuneStats[RoomStatNamesEnum.CreepCount] = room.myCreepsAmount
            globalCommuneStats[RoomStatNamesEnum.TotalCreepCount] = room.creepsFromRoomAmount
            globalCommuneStats[RoomStatNamesEnum.PowerCreepCount] = room.myPowerCreepsAmount

            const spawns = room.roomManager.structures.spawn
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
                globalCommuneStats[RoomStatNamesEnum.EnergyStored] = room.resourcesInStoringStructures.energy
                globalCommuneStats[RoomStatNamesEnum.BatteriesStoredTimes10] =
                    room.resourcesInStoringStructures.battery * 10
            } else {
                globalCommuneStats[RoomStatNamesEnum.EnergyStored] = roomStats[RoomStatNamesEnum.EnergyStored]
                globalCommuneStats[RoomStatNamesEnum.BatteriesStoredTimes10] =
                    roomStats[RoomStatNamesEnum.BatteriesStoredTimes10]
                globalCommuneStats[RoomStatNamesEnum.ControllerLevel] = roomStats[RoomStatNamesEnum.ControllerLevel]
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
            constructionSiteCount: 0,
            CPUUsers,
        }

        global.roomStats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
        global.CPUUsers = CPUUsers
        this.internationalEndTick()
    }

    internationalPreTick() {
        global.CPUUsers = CPUUsers
        global.roomStats = { [RoomTypes.commune]: {}, [RoomTypes.remote]: {} }
    }

    internationalEndTick() {
        const managerCPUStart = Game.cpu.getUsed()
        const timestamp = Date.now()

        global.lastReset = (global.lastReset || 0) + 1
        Memory.stats.lastReset = global.lastReset
        Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp
        Memory.stats.lastTickTimestamp = timestamp
        Memory.stats.lastTick = Game.time
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
        Memory.stats.heapUsage =
            Game.cpu.getHeapStatistics().total_heap_size / Game.cpu.getHeapStatistics().heap_size_limit
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

        const globalRoomKeys = Object.keys(global.roomStats[RoomTypes.commune])
        const notCheckedCommuneRooms = Object.keys(Memory.stats.rooms).filter(room => !globalRoomKeys.includes(room))
        globalRoomKeys.forEach(roomName => {
            this.roomCommuneFinalEndTick(roomName, Game.rooms[roomName])
        })

        notCheckedCommuneRooms.forEach(roomName => {
            const roomType = Memory.rooms[roomName][RoomMemoryKeys.type]
            if (roomType === RoomTypes.commune) {
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
                [InternationalStatNamesEnum.InternationalManagerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.InternationalManagerCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.InternationalManagerCPUUsage],
                ),
                [InternationalStatNamesEnum.CreepOrganizerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.CreepOrganizerCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.CreepOrganizerCPUUsage],
                ),
                [InternationalStatNamesEnum.MapVisualsManangerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.MapVisualsManangerCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.MapVisualsManangerCPUUsage],
                ),
                [InternationalStatNamesEnum.PowerCreepOrganizerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.PowerCreepOrganizerCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.PowerCreepOrganizerCPUUsage],
                ),
                [InternationalStatNamesEnum.TickConfigCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.TickConfigCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.TickConfigCPUUsage],
                ),
                [InternationalStatNamesEnum.RoomManagerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.RoomManagerCPUUsage],
                    global.CPUUsers[InternationalStatNamesEnum.RoomManagerCPUUsage],
                ),
                [InternationalStatNamesEnum.StatsManagerCPUUsage]: this.average(
                    CPUUsers[InternationalStatNamesEnum.StatsManagerCPUUsage],
                    cpuUsed,
                ),
            }
            customLog('Stats Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
        } else {
            Memory.stats.CPUUsers = {
                [InternationalStatNamesEnum.InternationalManagerCPUUsage]: undefined,
                [InternationalStatNamesEnum.CreepOrganizerCPUUsage]: undefined,
                [InternationalStatNamesEnum.MapVisualsManangerCPUUsage]: undefined,
                [InternationalStatNamesEnum.PowerCreepOrganizerCPUUsage]: undefined,
                [InternationalStatNamesEnum.TickConfigCPUUsage]: undefined,
                [InternationalStatNamesEnum.RoomManagerCPUUsage]: undefined,
                [InternationalStatNamesEnum.StatsManagerCPUUsage]: undefined,
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

export const updateStat = function (roomName: string, name: string, value: number, nonRoomStat: boolean = false) {
    if (nonRoomStat) {
        global.CPUUsers[name as InternationalStatNamesEnum] = value
        return
    }

    if (!global.roomStats) return

    const roomStatName = name as RoomStatNames
    const updateStats = GetLevelOfStatName(roomStatName) > 0

    if (!updateStats) return

    if (global.roomStats[RoomTypes.commune][roomName]) {

        (global.roomStats[RoomTypes.commune][roomName] as RoomCommuneStats)[roomStatName] += value
    }
    else if (global.roomStats[RoomTypes.remote][roomName]) {

        (global.roomStats[RoomTypes.remote][roomName] as RoomStats)[GetRemoteStatsName(roomStatName)] += value
    }
}
