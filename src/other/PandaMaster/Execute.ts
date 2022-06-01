import Market from './Market'
import ShardVision from './ShardVision'

export default function () {
    if (Memory.me === 'PandaMaster') {
        new Market().HandleOrderEveryTick()
        new ShardVision().Handle()
        RawMemory.segments[98] = JSON.stringify(Memory.stats)
    }
}
