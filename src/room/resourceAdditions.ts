Object.defineProperties(Resource.prototype, {
     reserveAmount: {
          get() {
               if (this._reserveAmount !== undefined) return this._reserveAmount

               return this._reserveAmount = this.amount
          },
          set(newAmount: number) {
               this._reserveAmount = newAmount
          },
     },
} as PropertyDescriptorMap & ThisType<Resource>)
