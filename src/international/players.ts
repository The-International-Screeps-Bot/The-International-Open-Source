import { isNumber } from 'lodash'
import { PlayerMemoryKeys, defaultDataDecay, playerDecayKeys } from './constants'
import { randomTick } from './utils'

const sleepFor = 10

export class PlayerManager {
    /**
     * The highest offensive threat of known players
     */
    highestThreat: number

    constructor() {}

    run() {
        if (this.sleeping(sleepFor)) return

        this.highestThreat = 0

        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            // Decay specified values over time

            for (const key of playerDecayKeys) {

                if (player[key] < 1) continue

                player[key] *= defaultDataDecay * sleepFor
            }

            // So long as the player has attacked at some pount, record it

            player[PlayerMemoryKeys.lastAttacked] += 1

            const threat = player[PlayerMemoryKeys.offensiveThreat]
            if (threat <= this.highestThreat) continue

            this.highestThreat = threat
        }
    }

    initPlayer(playerName: string) {

        return Memory.players[playerName] = {
            [PlayerMemoryKeys.offensiveThreat]: 0,
            [PlayerMemoryKeys.defensiveStrength]: 0,
            [PlayerMemoryKeys.hate]: 0,
            [PlayerMemoryKeys.lastAttacked]: Infinity,
            [PlayerMemoryKeys.rangeFromExitWeight]: 0.5,
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

    sleepUntil: number

    /**
     * @param sleepFor the number of ticks to sleep for
     * @returns Wether we are sleeping or not
     */
    private sleeping(sleepFor: number) {

        if (!this.sleepUntil) return true
        if (Game.time < this.sleepUntil) return true

        this.sleepUntil = Game.time + sleepFor
        return true
    }
}

export const playerManager = new PlayerManager()
