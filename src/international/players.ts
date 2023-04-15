import { isNumber } from 'lodash'
import { PlayerMemoryKeys } from './constants'
import { randomTick } from './utils'

export class PlayerManager {
    /**
     * The highest offensive threat of known players
     */
    highestThreat: number = 0

    constructor() {}

    run() {
        if (randomTick(20)) return

        this.highestThreat = 0

        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            // Reduce hate over time

            if (player[PlayerMemoryKeys.hate] > 0) player[PlayerMemoryKeys.hate] *= 0.9999

            // So long as the player has attacked at some pount, record it

            player[PlayerMemoryKeys.lastAttacked] += 1

            const threat = player[PlayerMemoryKeys.offensiveThreat]
            if (threat <= this.highestThreat) continue

            this.highestThreat = threat
        }
    }

    /**
     * Player names sorted from most hated to least
     */
    _playersByHate: string[]
    get playerByHate() {
        if (this._playersByHate) return this._playersByHate

        this._playersByHate = Object.keys(Memory.players).sort((a, b) => {
            return Memory.players[a][PlayerMemoryKeys.hate] - Memory.players[b][PlayerMemoryKeys.hate]
        })

        return this._playersByHate
    }
    /*
    _combatPriorities: []
    get combatPriorites() {


    }
 */
}

export const playerManager = new PlayerManager()
