import { isNumber } from 'lodash'
import { PlayerMemoryKeys, defaultDataDecay, playerDecayKeys } from './constants'
import { randomTick } from '../utils/utils'
import { Sleepable } from '../utils/Sleepable'

export class PlayerManager extends Sleepable {
    /**
     * The highest offensive threat of known players
     */
    highestThreat: number = 0

    run() {
        if (this.isSleepingResponsive()) return

        this.highestThreat = 0

        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            // Decay specified numberical values over time

            for (const key of playerDecayKeys) {
                if ((player[key] as number) < 1) continue
                ;(player[key] as number) *= defaultDataDecay / this.sleepFor
            }

            // So long as the player has attacked at some point, record it
            if (player[PlayerMemoryKeys.lastAttackedBy] !== undefined) {
                player[PlayerMemoryKeys.lastAttackedBy] += 1 * this.sleepFor
            }

            const threat = player[PlayerMemoryKeys.offensiveThreat]
            if (threat <= this.highestThreat) continue

            this.highestThreat = threat
        }
    }

    initPlayer(playerName: string) {
        return (Memory.players[playerName] = {
            [PlayerMemoryKeys.offensiveThreat]: 0,
            [PlayerMemoryKeys.defensiveStrength]: 0,
            [PlayerMemoryKeys.hate]: 0,
            [PlayerMemoryKeys.rangeFromExitWeight]: 0.5,
        })
    }

    /**
     * Player names sorted from most hated to least
     */
    _playersByHate: string[]
    get playerByHate() {
        if (this._playersByHate) return this._playersByHate

        this._playersByHate = Object.keys(Memory.players).sort((a, b) => {
            return (
                Memory.players[a][PlayerMemoryKeys.hate] - Memory.players[b][PlayerMemoryKeys.hate]
            )
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
