export class Duo {
     /**
      * All squad members
      */
     members: Creep[]

     /**
      * Squad assaulter
      */
     assaulter: Creep

     /**
      * Leader supporter
      */
     supporter: Creep

     constructor(members: Creep[], assaulter: Creep, supporter: Creep) {
          this.members = members
          this.assaulter = assaulter
          this.supporter = supporter
     }
     run() {}
     move(opts: MoveRequestOpts) {}
     advancedRangedAttack() {}
     advancedAttack() {}
     advancedDismantle() {}
     advancedHeal() {}
}
