import Market from './Market'
import ShardVision from './ShardVision'

export default function (shardOnly: boolean = true) {
    if (!shardOnly) new ShardVision().Handle()
    ShardVision.HandleShard()
    // new Market().HandleOrderEveryTick()
}
