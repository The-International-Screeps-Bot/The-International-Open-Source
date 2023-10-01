export interface ProfilerMemory {
    data: { [name: string]: ProfilerData }
    start?: number
    total: number
}

export interface ShardVisionMemory {
    shards?: { [shardName: string]: number }
    lastSeen: number
}

