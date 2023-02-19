import Market from './Market'
import ShardVision from './ShardVision'

export default function () {
    new ShardVision().Handle()
    // new Market().HandleOrderEveryTick()
}
