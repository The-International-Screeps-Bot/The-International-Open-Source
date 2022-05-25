type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T
     ? ((t: T, ...a: A) => void) extends (...x: infer X) => void
          ? X
          : never
     : never

type EnumerateInternal<A extends Array<unknown>, N extends number> = {
     0: A
     1: EnumerateInternal<PrependNextNum<A>, N>
}[N extends A['length'] ? 0 : 1]

type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>
type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never
type RequestEnums = Range<0, 5>

interface RequestTypes {
     RESOURCE: 0
     DEFENSE: 1
     ATTACK: 2
     EXECUTE: 3
     HATE: 4
}

interface Request {
     requestType: RequestEnums
     roomName?: string
     playerName?: string
     resourceType?: ResourceConstant
     maxAmount?: number
     /**
      * A number representing the need of the request, where 1 is highest and 0 is lowest
      */
     priority: number
}
