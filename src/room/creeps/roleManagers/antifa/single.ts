import { AntifaAssaulter } from 'room/creeps/creepClasses'

export class Single extends AntifaAssaulter {
     constructor(creepID: Id<Creep>) {
          super(creepID)
     }
     run() {}
     advancedRangedAttack() {}
     advancedAttack() {}
     advancedDismantle() {}
     advancedHeal() {}
}
