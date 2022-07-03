export class Quad {
     /**
      * All squad members
      */
     members: Creep[]

     /**
      * Squad assaulters
      */
     assaulters: Creep[]

     /**
      * Leader supporters
      */
      supporters: Creep[]

     constructor(members: Creep[], assaulters: Creep[], supporters: Creep[]) {
          this.members = members
          this.assaulters = assaulters
          this.supporters = supporters
     }
     run() {}
     move(opts: MoveRequestOpts) {}
     advancedRangedAttack() {}
     advancedAttack() {}
     advancedDismantle() {}
     advancedHeal() {}
}
