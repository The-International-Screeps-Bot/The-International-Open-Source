/*
Ripped from https://github.com/AlinaNova21/ZeSwarm/
only slightly modified and adjusted for Typescript
Usage:
At top of main: import memHack from './memHack
At top of loop() in main: MemHack.modifyMemory()
*/

interface MemHack {
    memory: any,
    parseTime: number,
    init: Function,
    modifyMemory: Function
}

const memHack: MemHack = {

    memory: null,
    parseTime: -1,

    init() {

        let cpu = Game.cpu.getUsed()

        this.memory = Memory

        Game.cpu.getUsed() - cpu

        this.memory = RawMemory._parsed
    },

    modifyMemory() {

        delete global.Memory

        global.Memory = this.memory

        RawMemory._parsed = this.memory
    }
}

memHack.init()

export { memHack }
