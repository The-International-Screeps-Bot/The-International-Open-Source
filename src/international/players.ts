import { isNumber } from 'lodash'
import { PlayerData } from './constants'

class PlayerManager {
    constructor() {}

    run() {
        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            // Reduce hate over time

            if (player.data[PlayerData.hate] > 0)
                player.data[PlayerData.hate] *= 0.99999

            // So long as the player has attacked at some pount, record it

            player.data[PlayerData.lastAttack] += 1
        }
    }
}

export const playerManager = new PlayerManager()
