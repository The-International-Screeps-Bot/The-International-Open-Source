Object.defineProperties(Creep.prototype, {
     reservation: {
          get() {
               if (!this.memory.reservations[0]) return false

               return (this._reservation = this.memory.reservations[0])
          },
     },
     strength: {
          get() {

               if (this._strength) return this._strength

               this._strength = 1

               for (const part of this.body) {
                    switch (part.type) {
                         case RANGED_ATTACK:
                              this._strength +=
                                   RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                              break
                         case ATTACK:
                              this._strength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                              break
                         case HEAL:
                              this._strength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
                              break
                         case TOUGH:
                              this._strength += 1 + 5 / (part.boost ? BOOSTS[part.type][part.boost].damage : 1)
                              break
                         default:
                              this._strength += 1
                    }
               }

               return this._strength
          },
     },
} as PropertyDescriptorMap & ThisType<Creep>)
