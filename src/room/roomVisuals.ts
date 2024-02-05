import {
  WorkRequestKeys,
  CombatRequestKeys,
  HaulRequestKeys,
  customColors,
  roomDimensions,
  stamps,
  packedPosLength,
  RoomMemoryKeys,
  RoomTypes,
  FlagNames,
} from '../constants/general'
import { StatsManager } from 'international/stats'
import { LogOps } from 'utils/logOps'
import { findObjectWithID, unpackNumAsCoord } from 'utils/utils'
import { RoomManager } from './room'
import { Rectangle, Table, Dial, Grid, Bar, Dashboard, LineChart, Label } from 'screeps-viz'
import { simpleAllies } from 'international/simpleAllies/simpleAllies'
import { CollectiveManager } from 'international/collective'
import { PlayerManager } from 'international/players'
import { unpackCoord } from 'other/codec'
import { CommuneUtils } from './commune/communeUtils'

export class RoomVisualsManager {
  roomManager: RoomManager

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager
  }

  public run() {
    this.roomVisuals()
  }

  private roomVisuals() {
    // Stop if roomVisuals are disabled

    if (!Game.flags[FlagNames.roomVisuals]) return

    this.controllerVisuals()
    this.spawnVisuals()
    this.cSiteTargetVisuals()
    this.reservedCoordsVisuals()
  }

  private controllerVisuals() {
    // Stop if there is no controller

    if (!this.roomManager.room.controller) return

    // If the controller is mine

    if (this.roomManager.room.controller.my) {
      // If the controller level is less than 8, show percentage to next level

      if (this.roomManager.room.controller.level < 8)
        this.roomManager.room.visual.text(
          `%${(
            (this.roomManager.room.controller.progress /
              this.roomManager.room.controller.progressTotal) *
            100
          ).toFixed(2)}`,
          this.roomManager.room.controller.pos.x,
          this.roomManager.room.controller.pos.y - 1,
          {
            backgroundColor: 'rgb(255, 0, 0, 0)',
            font: 0.5,
            opacity: 1,
            color: customColors.lightBlue,
            stroke: customColors.white,
            strokeWidth: 0.03,
          },
        )

      // Show the controller's level

      this.roomManager.room.visual.text(
        `${this.roomManager.room.controller.level}`,
        this.roomManager.room.controller.pos,
        {
          backgroundColor: 'rgb(255, 0, 0, 0)',
          font: 0.5,
          opacity: 0.8,
        },
      )
      return
    }

    // If the controller is reserved

    if (this.roomManager.room.controller.reservation) {
      // Define the reservationColor based on some conditions

      const color = () => {
        if (this.roomManager.room.controller.reservation.username === Memory.me) {
          return customColors.lightBlue
        }

        if (
          global.settings.allies.includes(this.roomManager.room.controller.reservation.username)
        ) {
          return customColors.green
        }

        return customColors.red
      }

      // Show the reservation time

      this.roomManager.room.visual.text(
        `${this.roomManager.room.controller.reservation.ticksToEnd}`,
        this.roomManager.room.controller.pos,
        {
          backgroundColor: 'rgb(255, 0, 0, 0)',
          font: 0.5,
          opacity: 0.8,
          color: color(),
          stroke: customColors.white,
          strokeWidth: 0.03,
        },
      )
    }
  }

  private spawnVisuals() {
    // Get the spawns in the room

    const spawns = this.roomManager.structures.spawn

    // Loop through them

    for (const spawn of spawns) {
      // Iterate if the spawn isn't spawning

      if (!spawn.spawning) continue

      // Get the spawning creep, iterating if it's undefined

      const creep = Game.creeps[spawn.spawning.name]
      if (!creep) continue

      // Otherwise display the role of the creep being spawn

      this.roomManager.room.visual.text(creep.role, spawn.pos.x, spawn.pos.y + 0.25, {
        backgroundColor: 'rgb(255, 0, 0, 0)',
        font: 0.5,
        opacity: 1,
        color: customColors.lightBlue,
        stroke: customColors.white,
        strokeWidth: 0.03,
      })

      // And display how many ticks left until spawned

      this.roomManager.room.visual.text(
        (spawn.spawning.remainingTime - 1).toString(),
        spawn.pos.x,
        spawn.pos.y - 0.25,
        {
          backgroundColor: 'rgb(255, 0, 0, 0)',
          font: 0.5,
          opacity: 1,
          color: customColors.lightBlue,
          stroke: customColors.white,
          strokeWidth: 0.03,
        },
      )
    }
  }

  private cSiteTargetVisuals() {
    // If there is not a CSTID, stop

    if (!this.roomManager.room.memory[RoomMemoryKeys.constructionSiteTarget]) return

    // Convert the construction target ID into a game object

    const constructionTarget = findObjectWithID(
      this.roomManager.room.memory[RoomMemoryKeys.constructionSiteTarget],
    )

    // If the constructionTarget exists, show visuals for it

    if (constructionTarget) this.roomManager.room.visual.text('🚧', constructionTarget.pos)
  }

  private reservedCoordsVisuals() {
    for (const [packedCoord] of this.roomManager.reservedCoords) {
      const coord = unpackCoord(packedCoord)

      this.roomManager.room.coordVisual(coord.x, coord.y)
    }
  }

  public internationalDataVisuals() {
    this.internationalAllyWorkRequestsDataVisuals(
      this.internationalAllyCombatRequestsDataVisuals(
        this.internationalAllyResourceRequestsDataVisuals(
          this.internationalRequestsDataVisuals(
            this.internationalTerminalRequestsDataVisuals(
              this.internationalStatDataVisuals(this.internationalGeneralDataVisuals(1)),
            ),
          ),
        ),
      ),
    )
  }

  private internationalGeneralDataVisuals(y: number) {
    const headers = ['funnelOrder', 'highestThreat', 'minCredits', 'last config']

    const data: any[][] = [[]]

    const funnelOrder = CollectiveManager.getFunnelOrder()

    data[0].push(
      funnelOrder.slice(0, 3),
      PlayerManager.highestThreat,
      CollectiveManager.minCredits,
      Game.time - Memory.lastConfig,
    )

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'International',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalStatDataVisuals(y: number) {
    const headers = [
      'est. income',
      'commune harvest',
      'remote harvest',
      'upgrade',
      'build',
      'repair other',
      'barricade repair',
      'spawn util',
    ]

    const data: any[][] = [[]]

    let totalEstimatedIncome = 0
    let totalCommuneEnergyHarvested = 0
    let totalRemoteEnergyHarvested = 0
    let totalUpgrade = 0
    let totalBuild = 0
    let totalRepairOther = 0
    let totalBarricadeRepair = 0
    let totalSpawn = 0

    for (const roomName in Memory.stats.rooms) {
      const room = Game.rooms[roomName]
      const roomStats = Memory.stats.rooms[roomName]

      totalEstimatedIncome += room.communeManager.estimatedEnergyIncome
      totalCommuneEnergyHarvested += roomStats.eih
      totalRemoteEnergyHarvested += roomStats.reih
      totalUpgrade += roomStats.eou
      totalBuild += roomStats.eob
      totalRepairOther += roomStats.eoro
      totalBarricadeRepair += roomStats.eorwr
      totalSpawn += roomStats.su
    }

    const avgSpawn = totalSpawn / CollectiveManager.communes.size

    data[0].push(
      totalEstimatedIncome.toFixed(2),
      totalCommuneEnergyHarvested.toFixed(2),
      totalRemoteEnergyHarvested.toFixed(2),
      totalUpgrade.toFixed(2),
      totalBuild.toFixed(2),
      totalRepairOther.toFixed(2),
      totalBarricadeRepair.toFixed(2),
      avgSpawn.toFixed(2),
    )

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'International',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalRequestsDataVisuals(y: number) {
    const headers = ['requestName', 'type', 'responderName', 'abandon']

    const data: any[][] = []

    for (const requestName in Memory.workRequests) {
      const request = Memory.workRequests[requestName]

      if (!request[WorkRequestKeys.responder]) continue

      const row: any[] = [
        requestName,
        'default',
        request[WorkRequestKeys.responder],
        request[WorkRequestKeys.abandon],
      ]
      data.push(row)
    }

    for (const requestName in Memory.combatRequests) {
      const request = Memory.combatRequests[requestName]

      if (request[CombatRequestKeys.type] !== 'defend' && !request[CombatRequestKeys.responder])
        continue

      const row: any[] = [
        requestName,
        request[CombatRequestKeys.type],
        request[CombatRequestKeys.responder] || 'none',
        request[CombatRequestKeys.abandon],
      ]
      data.push(row)
    }

    for (const requestName in Memory.haulRequests) {
      const request = Memory.haulRequests[requestName]

      if (!request[HaulRequestKeys.responder]) continue

      const row: any[] = [
        requestName,
        request[HaulRequestKeys.type],
        request[HaulRequestKeys.responder],
        request[HaulRequestKeys.abandon],
      ]
      data.push(row)
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'My Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalTerminalRequestsDataVisuals(y: number) {
    const headers = ['roomName', 'resource', 'amount', 'priority']

    const data: any[][] = []

    for (const ID in CollectiveManager.terminalRequests) {
      const request = CollectiveManager.terminalRequests[ID]

      const row: any[] = [request.roomName, request.resource, request.amount, request.priority]
      data.push(row)
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'My Terminal Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalAllyResourceRequestsDataVisuals(y: number) {
    if (!simpleAllies.allySegmentData) {
      return y
    }

    const headers = ['room', 'resource', 'amount', 'priority']

    const data: any[][] = []

    const requests = simpleAllies.allySegmentData.requests.resource
    for (const ID in requests) {
      const request = requests[ID]

      const row: any[] = [
        request.roomName,
        request.resourceType,
        request.amount,
        request.priority.toFixed(2),
      ]
      data.push(row)
      continue
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Incoming Ally Resource Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalAllyCombatRequestsDataVisuals(y: number) {
    if (!simpleAllies.allySegmentData) {
      return y
    }

    const headers = ['room', 'minDamage', 'minMeleeHeal', 'minRangedHeal', 'priority']

    const data: any[][] = []

    const defenseRequests = simpleAllies.allySegmentData.requests.defense
    for (const roomName in defenseRequests) {
      const request = defenseRequests[roomName]

      const row: any[] = [roomName, request.priority.toFixed(2)]
      data.push(row)
      continue
    }

    const attackRequests = simpleAllies.allySegmentData.requests.attack
    for (const roomName in attackRequests) {
      const request = attackRequests[roomName]

      const row: any[] = [roomName, request.priority.toFixed(2)]
      data.push(row)
      continue
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Incoming Ally Combat Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private internationalAllyWorkRequestsDataVisuals(y: number) {
    if (!simpleAllies.allySegmentData) {
      return y
    }

    const headers = ['room', 'type', 'priority']

    const data: any[][] = []

    const requests = simpleAllies.allySegmentData.requests.work
    for (const roomName in requests) {
      const request = requests[roomName]

      const row: any[] = [roomName, request.workType, request.priority.toFixed(2)]
      data.push(row)
      continue
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Incoming Ally Build Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  private generalDataVisuals(y: number) {
    const headers = [
      'energy',
      'minEnergy',
      'minRampartHits',
      'threatened',
      'last attacked',
      'upgrade thresh',
      'build thresh',
      'inferiority',
    ]

    const roomMemory = Memory.rooms[this.roomManager.room.name]

    const data: any[][] = [
      [
        this.roomManager.resourcesInStoringStructures.energy || 0,
        CommuneUtils.minStoredEnergy(this.roomManager.room),
        this.roomManager.room.communeManager.minRampartHits,
        roomMemory[RoomMemoryKeys.threatened].toFixed(2),
        roomMemory[RoomMemoryKeys.lastAttackedBy],
        CommuneUtils.storedEnergyUpgradeThreshold(this.roomManager.room),
        this.roomManager.room.communeManager.storedEnergyBuildThreshold,
        this.roomManager.room.towerInferiority || 'false',
      ],
    ]

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'General',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  statDataVisuals(y: number) {
    const headers = [
      'estimatedIncome',
      'CHarvest',
      'RHarvest',
      'upgrade',
      'build',
      'rep Other',
      'rep barricade',
      'barricades cost',
      'spawn util',
    ]

    const roomStats = Memory.stats.rooms[this.roomManager.room.name]

    const data: any[][] = [
      [
        this.roomManager.room.communeManager.estimatedEnergyIncome,
        roomStats.eih.toFixed(2),
        roomStats.reih.toFixed(2),
        roomStats.eou.toFixed(2),
        roomStats.eob.toFixed(2),
        roomStats.eoro.toFixed(2),
        roomStats.eorwr.toFixed(2),
        this.roomManager.room.communeManager.rampartsMaintenanceCost,
        (roomStats.su * 100).toFixed(2) + '%',
      ],
    ]

    const height = 3 + data.length

    Dashboard({
      config: {
        room: this.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Stats',
                headers,
              },
            })),
          }),
        },
      ],
    })

    return y + height
  }

  requestDataVisuals(y: number) {}
}
