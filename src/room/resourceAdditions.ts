Object.defineProperties(Resource.prototype, {
     global: {
          get() {
               if (this._reserveAmount) return this._reserveAmount

               return this._reserveAmount
          },
          set(newAmount: number) {
               this._reserveAmount = newAmount
          },
     },
} as PropertyDescriptorMap & ThisType<Resource>)
