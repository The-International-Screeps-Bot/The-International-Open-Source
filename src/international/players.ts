import { isNumber } from 'lodash'
import { PlayerData } from './constants'
import { randomTick } from './utils'

class PlayerManager {
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

            if (player.data[PlayerData.hate] > 0) player.data[PlayerData.hate] *= 0.9999

            // So long as the player has attacked at some pount, record it

            player.data[PlayerData.lastAttack] += 1

            const threat = player.data[PlayerData.offensiveThreat]
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
            return Memory.players[a].data[PlayerData.hate] - Memory.players[b].data[PlayerData.hate]
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
