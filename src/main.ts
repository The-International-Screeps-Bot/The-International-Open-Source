// Global

import { globalManager } from './global/globalManager'

// Room

import { roomManager } from './room/roomManager'

// Other

import { ErrorMapper } from './external/ErrorMapper'

// Type declareations for global

declare global {

    interface Room {
        [key: string]: any
    }

    interface RoomMemory {
        [key: string]: any
        anchorPoint: {[key: string]: any}
    }

    interface Creep {
        [key: string]: any

    }

    interface CreepMemory {
        [key: string]: any
        role: string
    }

    namespace NodeJS {
        interface Global {
            [key: string]: any
            avgPrice(): void
            createClass(): void
            allyList: string[]
        }
    }
}

// Loop

export const loop = ErrorMapper.wrapLoop(function() {

    globalManager()

    roomManager()

    new CustomLog('Title', 'Message', undefined, undefined)

    for (let i = 0; i < 99; i++) console.log()
    console.log(global.customLogs)
})
