export class Duo {
     /**
      * All squad members
      */
     members: Creep[]

     /**
      * Squad leader
      */
     leader: Creep

     /**
      * Leader follower
      */
     follower: Creep

     constructor(members: Creep[], leader: Creep, follower: Creep) {
          this.members = members
          this.leader = leader
          this.follower = follower
     }
     move(opts: MoveRequestOpts) {}
     rangedAttack() {}
     attack() {}
     dismantle() {}
     heal() {}
}
