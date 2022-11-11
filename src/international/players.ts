import { PlayerData } from './constants'

class PlayerManager {
    constructor() {}

    run() {
        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            player.data[PlayerData.hate] -= 1 + player.data[PlayerData.lastAttack] * 0.002
            player.data[PlayerData.lastAttack] += 1
        }
    }
}

export const playerManager = new PlayerManager()
