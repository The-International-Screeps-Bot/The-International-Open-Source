type Poly = [number, number][]
interface SpeechStyle {
    background?: string
    textcolor?: string
    textsize?: number
    textstyle?: string
    textfont?: string
    opacity?: number
}

interface AnimatedStyle {
    color?: string
    opacity?: number
    radius?: number
    frames?: number
}

interface RoomVisual {
    roads: Poly
    structure(x: number, y: number, type: StructureConstant, opts?: PolyStyle): void
    connectRoads(opts?: LineStyle): RoomVisual
    speech(text: string, x: number, y: number, opts?: SpeechStyle): RoomVisual
    animatedPosition(x: number, y: number, opts?: AnimatedStyle): RoomVisual
    test(): RoomVisual
    resource(type: ResourceConstant, x: number, y: number, size?: number): void
    _fluid(type: ResourceConstant, x: number, y: number, size?: number): void
    _mineral(type: ResourceConstant, x: number, y: number, size?: number): void
    _compound(type: ResourceConstant, x: number, y: number, size?: number): void
}

const colors = {
    gray: '#555555',
    light: '#AAAAAA',
    road: '#666', // >:D
    energy: '#FFE87B',
    power: '#F53547',
    dark: '#181818',
    outline: '#8FBB93',
    speechText: '#000000',
    speechBackground: '#2ccf3b',
}

const speechSize = 0.5
const speechFont = 'Times New Roman'

function calculateFactoryLevelGapsPoly() {
    let x = -0.08
    let y = -0.52
    const result = []

    const gapAngle = 16 * (Math.PI / 180)
    const c1 = Math.cos(gapAngle)
    const s1 = Math.sin(gapAngle)

    const angle = 72 * (Math.PI / 180)
    const c2 = Math.cos(angle)
    const s2 = Math.sin(angle)

    for (let i = 0; i < 5; i += 1) {
        result.push([0.0, 0.0])
        result.push([x, y])
        result.push([x * c1 - y * s1, x * s1 + y * c1])
        const tmpX = x * c2 - y * s2
        y = x * s2 + y * c2
        x = tmpX
    }
    return result
}
const factoryLevelGaps = calculateFactoryLevelGapsPoly()

RoomVisual.prototype.structure = function (x, y, type, opts = {}) {
    opts = {
        opacity: 1,
        ...opts,
    }
    switch (type) {
        case STRUCTURE_FACTORY: {
            const outline = [
                [-0.68, -0.11],
                [-0.84, -0.18],
                [-0.84, -0.32],
                [-0.44, -0.44],
                [-0.32, -0.84],
                [-0.18, -0.84],
                [-0.11, -0.68],

                [0.11, -0.68],
                [0.18, -0.84],
                [0.32, -0.84],
                [0.44, -0.44],
                [0.84, -0.32],
                [0.84, -0.18],
                [0.68, -0.11],

                [0.68, 0.11],
                [0.84, 0.18],
                [0.84, 0.32],
                [0.44, 0.44],
                [0.32, 0.84],
                [0.18, 0.84],
                [0.11, 0.68],

                [-0.11, 0.68],
                [-0.18, 0.84],
                [-0.32, 0.84],
                [-0.44, 0.44],
                [-0.84, 0.32],
                [-0.84, 0.18],
                [-0.68, 0.11],
            ]
            this.poly(
                outline.map(p => [p[0] + x, p[1] + y]),
                {
                    fill: undefined,
                    stroke: colors.outline,
                    strokeWidth: 0.05,
                    opacity: opts.opacity,
                },
            )
            // outer circle
            this.circle(x, y, {
                radius: 0.65,
                fill: '#232323',
                strokeWidth: 0.035,
                stroke: '#140a0a',
                opacity: opts.opacity,
            })
            const spikes = [
                [-0.4, -0.1],
                [-0.8, -0.2],
                [-0.8, -0.3],
                [-0.4, -0.4],
                [-0.3, -0.8],
                [-0.2, -0.8],
                [-0.1, -0.4],

                [0.1, -0.4],
                [0.2, -0.8],
                [0.3, -0.8],
                [0.4, -0.4],
                [0.8, -0.3],
                [0.8, -0.2],
                [0.4, -0.1],

                [0.4, 0.1],
                [0.8, 0.2],
                [0.8, 0.3],
                [0.4, 0.4],
                [0.3, 0.8],
                [0.2, 0.8],
                [0.1, 0.4],

                [-0.1, 0.4],
                [-0.2, 0.8],
                [-0.3, 0.8],
                [-0.4, 0.4],
                [-0.8, 0.3],
                [-0.8, 0.2],
                [-0.4, 0.1],
            ]
            this.poly(
                spikes.map(p => [p[0] + x, p[1] + y]),
                {
                    fill: colors.gray,
                    stroke: '#140a0a',
                    strokeWidth: 0.04,
                    opacity: opts.opacity,
                },
            )
            // factory level circle
            this.circle(x, y, {
                radius: 0.54,
                fill: '#302a2a',
                strokeWidth: 0.04,
                stroke: '#140a0a',
                opacity: opts.opacity,
            })
            this.poly(
                factoryLevelGaps.map(p => [p[0] + x, p[1] + y]),
                {
                    fill: '#140a0a',
                    stroke: undefined,
                    opacity: opts.opacity,
                },
            )
            // inner black circle
            this.circle(x, y, {
                radius: 0.42,
                fill: '#140a0a',
                opacity: opts.opacity,
            })
            this.rect(x - 0.24, y - 0.24, 0.48, 0.48, {
                fill: '#3f3f3f',
                opacity: opts.opacity,
            })
            break
        }
        case STRUCTURE_EXTENSION:
            this.circle(x, y, {
                radius: 0.5,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.circle(x, y, {
                radius: 0.35,
                fill: colors.gray,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: '#CCCCCC',
                strokeWidth: 0.1,
                opacity: opts.opacity,
            })
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.energy,
                opacity: opts.opacity,
            })

            break
        case STRUCTURE_POWER_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: colors.power,
                strokeWidth: 0.1,
                opacity: opts.opacity,
            })
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.energy,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_LINK: {
            let outer: Poly = [
                [0.0, -0.5],
                [0.4, 0.0],
                [0.0, 0.5],
                [-0.4, 0.0],
            ]
            let inner: Poly = [
                [0.0, -0.3],
                [0.25, 0.0],
                [0.0, 0.3],
                [-0.25, 0.0],
            ]
            outer = relPoly(x, y, outer)
            inner = relPoly(x, y, inner)
            outer.push(outer[0])
            inner.push(inner[0])
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.poly(inner, {
                fill: colors.gray,
                stroke: undefined,
                opacity: opts.opacity,
            })
            break
        }
        case STRUCTURE_TERMINAL: {
            let outer: Poly = [
                [0.0, -0.8],
                [0.55, -0.55],
                [0.8, 0.0],
                [0.55, 0.55],
                [0.0, 0.8],
                [-0.55, 0.55],
                [-0.8, 0.0],
                [-0.55, -0.55],
            ]
            let inner: Poly = [
                [0.0, -0.65],
                [0.45, -0.45],
                [0.65, 0.0],
                [0.45, 0.45],
                [0.0, 0.65],
                [-0.45, 0.45],
                [-0.65, 0.0],
                [-0.45, -0.45],
            ]
            outer = relPoly(x, y, outer)
            inner = relPoly(x, y, inner)
            outer.push(outer[0])
            inner.push(inner[0])
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.poly(inner, {
                fill: colors.light,
                stroke: undefined,
                opacity: opts.opacity,
            })
            this.rect(x - 0.45, y - 0.45, 0.9, 0.9, {
                fill: colors.gray,
                stroke: colors.dark,
                strokeWidth: 0.1,
                opacity: opts.opacity,
            })
            break
        }
        case STRUCTURE_LAB:
            this.circle(x, y - 0.025, {
                radius: 0.55,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.circle(x, y - 0.025, {
                radius: 0.4,
                fill: colors.gray,
                opacity: opts.opacity,
            })
            this.rect(x - 0.45, y + 0.3, 0.9, 0.25, {
                fill: colors.dark,
                stroke: undefined,
                opacity: opts.opacity,
            })

            let box: Poly = [
                [-0.45, 0.3],
                [-0.45, 0.55],
                [0.45, 0.55],
                [0.45, 0.3],
            ]
            box = relPoly(x, y, box)
            this.poly(box, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })

            break
        case STRUCTURE_TOWER:
            this.circle(x, y, {
                radius: 0.6,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.rect(x - 0.4, y - 0.3, 0.8, 0.6, {
                fill: colors.gray,
                opacity: opts.opacity,
            })
            this.rect(x - 0.2, y - 0.9, 0.4, 0.5, {
                fill: colors.light,
                stroke: colors.dark,
                strokeWidth: 0.07,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_ROAD:
            this.circle(x, y, {
                radius: 0.175,
                fill: colors.road,
                stroke: undefined,
                opacity: opts.opacity,
            })
            if (!this.roads) this.roads = []
            this.roads.push([x, y])
            break
        case STRUCTURE_RAMPART:
            this.rect(x - 0.5, y - 0.5, 1, 1, {
                fill: opts.fill || 'rgb(78, 104, 79)',
                stroke: opts.fill || 'rgb(106, 180, 107)',
                strokeWidth: 0.12,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_WALL:
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.dark,
                stroke: colors.light,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_STORAGE:
            const outline1 = relPoly(x, y, [
                [-0.45, -0.55],
                [0, -0.65],
                [0.45, -0.55],
                [0.55, 0],
                [0.45, 0.55],
                [0, 0.65],
                [-0.45, 0.55],
                [-0.55, 0],
                [-0.45, -0.55],
            ])
            this.poly(outline1, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity,
            })
            this.rect(x - 0.35, y - 0.45, 0.7, 0.9, {
                fill: colors.energy,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_OBSERVER:
            this.circle(x, y, {
                fill: colors.dark,
                radius: 0.45,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            })
            this.circle(x + 0.225, y, {
                fill: colors.outline,
                radius: 0.2,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_NUKER:
            let outline: Poly = [
                [0, -1],
                [-0.47, 0.2],
                [-0.5, 0.5],
                [0.5, 0.5],
                [0.47, 0.2],
                [0, -1],
            ]
            outline = relPoly(x, y, outline)
            this.poly(outline, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity,
            })
            let inline: Poly = [
                [0, -0.8],
                [-0.4, 0.2],
                [0.4, 0.2],
                [0, -0.8],
            ]
            inline = relPoly(x, y, inline)
            this.poly(inline, {
                stroke: colors.outline,
                strokeWidth: 0.01,
                fill: colors.gray,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_CONTAINER:
            this.rect(x - 0.225, y - 0.3, 0.45, 0.6, {
                fill: colors.gray,
                opacity: opts.opacity,
                stroke: colors.dark,
                strokeWidth: 0.09,
            })
            this.rect(x - 0.17, y + 0.07, 0.34, 0.2, {
                fill: colors.energy,
                opacity: opts.opacity,
            })
            break
        case STRUCTURE_EXTRACTOR:
            this.circle(x, y, {
                radius: 0.65,
                opacity: opts.opacity,
                stroke: '#47b165',
                strokeWidth: 0.12,
                fill: 'transparent',
            })
            break
        default:
            this.circle(x, y, {
                fill: colors.light,
                radius: 0.35,
                stroke: colors.dark,
                strokeWidth: 0.2,
                opacity: opts.opacity,
            })
            break
    }

    return this
}

const dirs = [[], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]

function rotate(x: number, y: number, s: number, c: number, px: number, py: number) {
    const xDelta = x * c - y * s
    const yDelta = x * s + y * c
    return { x: px + xDelta, y: py + yDelta }
}

function relPoly(x: number, y: number, poly: Poly) {
    return poly.map(p => {
        p[0] += x
        p[1] += y
        return p
    })
}

RoomVisual.prototype.connectRoads = function (opts = {}) {
    const color = opts.color || colors.road || 'white'
    if (!this.roads) return this
    this.roads.forEach(r => {
        for (let i = 1; i <= 4; i += 1) {
            const d = dirs[i]
            const c = [r[0] + d[0], r[1] + d[1]]
            const rd = _.some(this.roads, r => r[0] === c[0] && r[1] === c[1])
            if (rd) {
                this.line(r[0], r[1], c[0], c[1], {
                    color,
                    width: 0.35,
                    opacity: opts.opacity || 1,
                })
            }
        }
    })

    return this
}

RoomVisual.prototype.speech = function (text, x, y, opts = {}) {
    const background = opts.background ? opts.background : colors.speechBackground
    const textcolor = opts.textcolor ? opts.textcolor : colors.speechText
    const textstyle = opts.textstyle ? opts.textstyle : false
    const textsize = opts.textsize ? opts.textsize : speechSize
    const textfont = opts.textfont ? opts.textfont : speechFont
    const opacity = opts.opacity ? opts.opacity : 1
    let fontstring = ''
    if (textstyle) {
        fontstring = `${textstyle} `
    }
    fontstring += `${textsize} ${textfont}`

    let pointer: Poly = [
        [-0.2, -0.8],
        [0.2, -0.8],
        [0, -0.3],
    ]
    pointer = relPoly(x, y, pointer)
    pointer.push(pointer[0])

    this.poly(pointer, {
        fill: background,
        stroke: background,
        opacity,
        strokeWidth: 0.0,
    })

    this.text(text, x, y - 1, {
        color: textcolor,
        backgroundColor: background,
        backgroundPadding: 0.1,
        opacity,
        font: fontstring,
    })

    return this
}

RoomVisual.prototype.animatedPosition = function (x, y, opts = {}) {
    const color = opts.color ? opts.color : 'blue'
    const opacity = opts.opacity ? opts.opacity : 0.5
    let radius = opts.radius ? opts.radius : 0.75
    const frames = opts.frames ? opts.frames : 6

    const angle = (((Game.time % frames) * 90) / frames) * (Math.PI / 180)
    const s = Math.sin(angle)
    const c = Math.cos(angle)

    const sizeMod = Math.abs((Game.time % frames) - frames / 2) / 10
    radius += radius * sizeMod

    const points: Poly = [
        rotate(0, -radius, s, c, x, y),
        rotate(radius, 0, s, c, x, y),
        rotate(0, radius, s, c, x, y),
        rotate(-radius, 0, s, c, x, y),
        rotate(0, -radius, s, c, x, y),
    ].map(p => [p.x, p.y])

    this.poly(points, { stroke: color, opacity })

    return this
}

RoomVisual.prototype.test = function test() {
    const demopos = [19, 24]
    this.clear()
    this.structure(demopos[0] + 0, demopos[1] + 0, STRUCTURE_LAB)
    this.structure(demopos[0] + 1, demopos[1] + 1, STRUCTURE_TOWER)
    this.structure(demopos[0] + 2, demopos[1] + 0, STRUCTURE_LINK)
    this.structure(demopos[0] + 3, demopos[1] + 1, STRUCTURE_TERMINAL)
    this.structure(demopos[0] + 4, demopos[1] + 0, STRUCTURE_EXTENSION)
    this.structure(demopos[0] + 5, demopos[1] + 1, STRUCTURE_SPAWN)

    return this
}

/// #region RESOURCE BADGES
const ColorSets = {
    white: ['#ffffff', '#4c4c4c'],
    grey: ['#b4b4b4', '#4c4c4c'],
    red: ['#ff7b7b', '#592121'],
    yellow: ['#fdd388', '#5d4c2e'],
    green: ['#00f4a2', '#236144'],
    blue: ['#50d7f9', '#006181'],
    purple: ['#a071ff', '#371383'],
}
const ResourceColors: Partial<{ [key in ResourceConstant]: string[] }> = {
    [RESOURCE_ENERGY]: ColorSets.yellow,
    [RESOURCE_POWER]: ColorSets.red,

    [RESOURCE_HYDROGEN]: ColorSets.grey,
    [RESOURCE_OXYGEN]: ColorSets.grey,
    [RESOURCE_UTRIUM]: ColorSets.blue,
    [RESOURCE_LEMERGIUM]: ColorSets.green,
    [RESOURCE_KEANIUM]: ColorSets.purple,
    [RESOURCE_ZYNTHIUM]: ColorSets.yellow,
    [RESOURCE_CATALYST]: ColorSets.red,
    [RESOURCE_GHODIUM]: ColorSets.white,

    [RESOURCE_HYDROXIDE]: ColorSets.grey,
    [RESOURCE_ZYNTHIUM_KEANITE]: ColorSets.grey,
    [RESOURCE_UTRIUM_LEMERGITE]: ColorSets.grey,

    [RESOURCE_UTRIUM_HYDRIDE]: ColorSets.blue,
    [RESOURCE_UTRIUM_OXIDE]: ColorSets.blue,
    [RESOURCE_KEANIUM_HYDRIDE]: ColorSets.purple,
    [RESOURCE_KEANIUM_OXIDE]: ColorSets.purple,
    [RESOURCE_LEMERGIUM_HYDRIDE]: ColorSets.green,
    [RESOURCE_LEMERGIUM_OXIDE]: ColorSets.green,
    [RESOURCE_ZYNTHIUM_HYDRIDE]: ColorSets.yellow,
    [RESOURCE_ZYNTHIUM_OXIDE]: ColorSets.yellow,
    [RESOURCE_GHODIUM_HYDRIDE]: ColorSets.white,
    [RESOURCE_GHODIUM_OXIDE]: ColorSets.white,

    [RESOURCE_UTRIUM_ACID]: ColorSets.blue,
    [RESOURCE_UTRIUM_ALKALIDE]: ColorSets.blue,
    [RESOURCE_KEANIUM_ACID]: ColorSets.purple,
    [RESOURCE_KEANIUM_ALKALIDE]: ColorSets.purple,
    [RESOURCE_LEMERGIUM_ACID]: ColorSets.green,
    [RESOURCE_LEMERGIUM_ALKALIDE]: ColorSets.green,
    [RESOURCE_ZYNTHIUM_ACID]: ColorSets.yellow,
    [RESOURCE_ZYNTHIUM_ALKALIDE]: ColorSets.yellow,
    [RESOURCE_GHODIUM_ACID]: ColorSets.white,
    [RESOURCE_GHODIUM_ALKALIDE]: ColorSets.white,

    [RESOURCE_CATALYZED_UTRIUM_ACID]: ColorSets.blue,
    [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: ColorSets.blue,
    [RESOURCE_CATALYZED_KEANIUM_ACID]: ColorSets.purple,
    [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: ColorSets.purple,
    [RESOURCE_CATALYZED_LEMERGIUM_ACID]: ColorSets.green,
    [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: ColorSets.green,
    [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: ColorSets.yellow,
    [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: ColorSets.yellow,
    [RESOURCE_CATALYZED_GHODIUM_ACID]: ColorSets.white,
    [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: ColorSets.white,
}

const MINERALS = [
    RESOURCE_CATALYST,
    RESOURCE_HYDROGEN,
    RESOURCE_OXYGEN,
    RESOURCE_LEMERGIUM,
    RESOURCE_UTRIUM,
    RESOURCE_ZYNTHIUM,
    RESOURCE_KEANIUM,
]

RoomVisual.prototype.resource = function (type, x, y, size = 0.25) {
    if (type == RESOURCE_ENERGY || type == RESOURCE_POWER) this._fluid(type, x, y, size)
    else if (MINERALS.includes(type as MineralConstant)) this._mineral(type, x, y, size)
    else if (ResourceColors[type] != undefined) this._compound(type, x, y, size)
    else return ERR_INVALID_ARGS
    return OK
}
RoomVisual.prototype._fluid = function (type, x, y, size = 0.25) {
    this.circle(x, y, {
        radius: size,
        fill: ResourceColors[type][0],
        opacity: 1,
    })
    this.text(type[0], x, y - size * 0.1, {
        font: size * 1.5,
        color: ResourceColors[type][1],
        backgroundColor: ResourceColors[type][0],
        backgroundPadding: 0,
    })
}
RoomVisual.prototype._mineral = function (type, x, y, size = 0.25) {
    this.circle(x, y, {
        radius: size,
        fill: ResourceColors[type][0],
        opacity: 1,
    })
    this.circle(x, y, {
        radius: size * 0.8,
        fill: ResourceColors[type][1],
        opacity: 1,
    })
    this.text(type, x, y + size * 0.03, {
        font: 'bold ' + size * 1.25 + ' arial',
        color: ResourceColors[type][0],
        backgroundColor: ResourceColors[type][1],
        backgroundPadding: 0,
    })
}
RoomVisual.prototype._compound = function (type, x, y, size = 0.25) {
    let label = type.replace('2', '₂')

    this.text(label, x, y, {
        font: 'bold ' + size * 1 + ' arial',
        color: ResourceColors[type][1],
        backgroundColor: ResourceColors[type][0],
        backgroundPadding: 0.3 * size,
    })
}
