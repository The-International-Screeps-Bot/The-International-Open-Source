Object.defineProperties(Resource.prototype, {
     nextAmount: {
          get() {
               if (this._nextAmount !== undefined) return this._nextAmount

               return this._nextAmount = this.amount
          },
          set(newAmount: number) {
               this._nextAmount = newAmount
          },
     },
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
