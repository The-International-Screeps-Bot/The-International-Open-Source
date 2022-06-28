export class Quad {
     /**
      * All squad members
      */
     members: Creep[]

     /**
      * Squad leaders
      */
     leaders: Creep[]

     /**
      * Leader followers
      */
     followers: Creep[]

     constructor(members: Creep[], leaders: Creep[], followers: Creep[]) {
          this.members = members
          this.leaders = leaders
          this.followers = followers
     }
     move(opts: MoveRequestOpts) {}
     rangedAttack() {}
     attack() {}
     dismantle() {}
     heal() {}
}
