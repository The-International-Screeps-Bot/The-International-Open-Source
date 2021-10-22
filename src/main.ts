// Global

import "./global/globalManager"

// Room

import "./room/roomManager"

// Other

import { ErrorMapper } from "./external/ErrorMapper"

// Type declareations for global

declare global {
    namespace NodeJS {
        interface Global {
            avgPrice(): void
            allyList: string[]
        }
    }
}

// Loop

export const loop = ErrorMapper.wrapLoop(function() {


})
