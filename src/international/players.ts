import { isNumber } from 'lodash'
import { PlayerMemoryKeys, defaultDataDecay, playerDecayKeys } from '../constants/general'
import { randomTick } from '../utils/utils'
import { Sleepable, StaticSleepable } from '../utils/sleepable'
import { PlayerRelationships } from '../constants/general'
import { PlayerMemory } from 'types/players'

export class PlayerManager extends StaticSleepable {
    /**
     * The highest offensive threat of known players
     */
    static highestThreat: number = 0

    static run() {
        if (this.isSleepingResponsive()) return

        this.highestThreat = 0

        for (const playerName in Memory.players) {
            const player = Memory.players[playerName]

            // Decay specified numberical values over time

            for (const key of playerDecayKeys) {
                if ((player[key] as number) < 1) {
                    continue
                }

                (player[key] as number) *= defaultDataDecay / this.sleepFor
            }

            // So long as the player has attacked at some point, record it
            if (player[PlayerMemoryKeys.lastAttackedBy] !== undefined) {
                player[PlayerMemoryKeys.lastAttackedBy] += 1 * this.sleepFor
            }

            const threat = player[PlayerMemoryKeys.offensiveThreat]
            if (threat > this.highestThreat) {
                this.highestThreat = threat
            }


        }
    }

    static initPlayer(playerName: string): Partial<PlayerMemory> {

        return (Memory.players[playerName] = {
            [PlayerMemoryKeys.offensiveThreat]: 0,
            [PlayerMemoryKeys.defensiveStrength]: 0,
            [PlayerMemoryKeys.hate]: 0,
            [PlayerMemoryKeys.rangeFromExitWeight]: 0.5,
            [PlayerMemoryKeys.relationship]: this.findInitialRelationship(playerName)
        })
    }

    private static findInitialRelationship(playerName: string) {

        const isAlly = global.settings.allies.includes(playerName)
        if (isAlly) return PlayerRelationships.ally
        // They are not an ally, so they are an enemy
        return PlayerRelationships.enemy
    }

    /**
     * Player names sorted from most hated to least
     */
    static _playersByHate: string[]
    static get playerByHate() {
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
