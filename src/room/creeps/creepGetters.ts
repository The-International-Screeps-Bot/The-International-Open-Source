Object.defineProperties(Creep.prototype, {
     reservation: {
          get() {
               if (!this.memory.reservations[0]) return false

               return (this._reservation = this.memory.reservations[0])
          },
     },
} as PropertyDescriptorMap & ThisType<Creep>)
