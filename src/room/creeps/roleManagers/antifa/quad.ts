import { Antifa } from './antifa'

export class Quad {
    /**
     * All squad members, where index 0 is the leader
     */
    members: Antifa[]
    leader: Antifa
    expectedSize: 4

    constructor(members: Antifa[]) {
        this.members = members
        this.leader = members[0]
    }
    run() {}
    move(opts: MoveRequestOpts) {}
    advancedRangedAttack() {}
    advancedAttack() {}
    advancedDismantle() {}
    advancedHeal() {}
}
