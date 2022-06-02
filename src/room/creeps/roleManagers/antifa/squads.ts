export interface Squad {
     enterAttackMode(): boolean

     do(): void
}

export class Squad {
     constructor() {}
}

export interface Duo {}

export class Duo extends Squad {
     constructor() {
          super()
     }
}

export interface Quad {}

export class Quad extends Squad {
     constructor() {
          super()
     }
}
