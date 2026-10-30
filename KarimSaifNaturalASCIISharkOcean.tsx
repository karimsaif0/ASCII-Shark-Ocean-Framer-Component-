
/* Made with 💛 by Karim Saif */

import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
} from "framer"

type Species =
    | "hammerhead"
    | "greatHammerhead"
    | "greatWhite"
    | "tiger"
    | "mako"
    | "thresher"
    | "nurse"
    | "zebra"

type Preset = "reference" | "pearl" | "chromatic" | "midnight"
type Boundary = "contained" | "free"
type Vec = { x: number; y: number }
type RGB = [number, number, number]

interface Props {
    preset: Preset
    species: Species
    boundaryMode: Boundary
    count: number
    size: number
    speed: number
    cellSize: number
    density: number
    contrast: number
    opacity: number
    background: string
    primary: string
    secondary: string
    accent: string
    colorVariation: number
    dissolve: number
    grid: boolean
    fish: boolean
    fishCount: number
    cursor: boolean
    cursorRadius: number
    separation: number
    avoidance: number
    avoidanceDistance: number
    swimCurvature: number
    roaming: number
    tailSpeed: number
    tailStrength: number
    bodyFlex: number
    turnSmoothness: number
    paused: boolean
    maxDpr: number
    maxFps: number
    style?: React.CSSProperties
}

interface Profile {
    width: number
    head: number
    fin: number
    tail: number
    nose: number
}

interface Shark {
    id: number
    x: number
    y: number
    angle: number
    omega: number
    velocity: number
    length: number
    phase: number
    seed: number
    goal: Vec
    goalTimer: number
    trail: Vec[]
    side: number
    stuckTime: number
}

interface Fish {
    x: number
    y: number
    velocity: number
    phase: number
}

interface Geometry {
    path: Path2D
    minX: number
    minY: number
    maxX: number
    maxY: number
}

const PI = Math.PI
const TAU = PI * 2

const clamp = (n: number, a: number, b: number) =>
    Math.max(a, Math.min(b, n))

const mix = (a: number, b: number, t: number) =>
    a + (b - a) * t

const damp = (rate: number, dt: number) =>
    1 - Math.exp(-rate * dt)

const distance = (a: Vec, b: Vec) =>
    Math.hypot(a.x - b.x, a.y - b.y)

const angleDelta = (a: number, b: number) =>
    Math.atan2(Math.sin(b - a), Math.cos(b - a))

function hash(a: number, b: number, c: number): number {
    let n =
        Math.imul(a | 0, 374761393) ^
        Math.imul(b | 0, 668265263) ^
        Math.imul(c | 0, 1442695041)

    n = Math.imul(n ^ (n >>> 13), 1274126177)

    return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

function parseColor(value: string): RGB {
    const s = (value || "").trim()

    if (/^#[0-9a-f]{6}$/i.test(s)) {
        return [
            parseInt(s.slice(1, 3), 16),
            parseInt(s.slice(3, 5), 16),
            parseInt(s.slice(5, 7), 16),
        ]
    }

    if (/^#[0-9a-f]{3}$/i.test(s)) {
        return [
            parseInt(s[1] + s[1], 16),
            parseInt(s[2] + s[2], 16),
            parseInt(s[3] + s[3], 16),
        ]
    }

    const m = s.match(
        /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i
    )

    return m
        ? [Number(m[1]), Number(m[2]), Number(m[3])]
        : [70, 76, 85]
}

function getColors(p: Props): RGB[] {
    switch (p.preset) {
        case "pearl":
            return [
                [94, 108, 118],
                [175, 190, 196],
                [139, 164, 177],
            ]
        case "chromatic":
            return [
                [67, 75, 98],
                [135, 94, 176],
                [69, 156, 168],
            ]
        case "midnight":
            return [
                [171, 198, 223],
                [88, 158, 205],
                [135, 217, 233],
            ]
        default:
            return [
                parseColor(p.primary),
                parseColor(p.secondary),
                parseColor(p.accent),
            ]
    }
}

function getBackground(p: Props): string {
    return p.preset === "midnight" ? "#050810" : p.background
}

const profiles: Record<Species, Profile> = {
    hammerhead: {
        width: 0.94,
        head: 0.31,
        fin: 0.29,
        tail: 0.17,
        nose: 0.04,
    },
    greatHammerhead: {
        width: 1,
        head: 0.38,
        fin: 0.31,
        tail: 0.19,
        nose: 0.04,
    },
    greatWhite: {
        width: 1.32,
        head: 0,
        fin: 0.33,
        tail: 0.2,
        nose: 0.012,
    },
    tiger: {
        width: 1.16,
        head: 0,
        fin: 0.32,
        tail: 0.19,
        nose: 0.018,
    },
    mako: {
        width: 0.88,
        head: 0,
        fin: 0.27,
        tail: 0.2,
        nose: 0.008,
    },
    thresher: {
        width: 0.94,
        head: 0,
        fin: 0.3,
        tail: 0.36,
        nose: 0.012,
    },
    nurse: {
        width: 1.18,
        head: 0,
        fin: 0.29,
        tail: 0.16,
        nose: 0.055,
    },
    zebra: {
        width: 1,
        head: 0,
        fin: 0.29,
        tail: 0.18,
        nose: 0.016,
    },
}

function getLayout(n: number) {
    const cols = Math.ceil(Math.sqrt(n * 1.7))

    return {
        cols,
        rows: Math.ceil(n / cols),
    }
}

function getSharkLength(p: Props, w: number, h: number) {
    const n = clamp(Math.round(p.count), 1, 7)
    const { cols, rows } = getLayout(n)
    const region = Math.min(w / cols, h / rows)
    const requested = region * 0.25 * clamp(p.size, 0.1, 3.5)
    const profile = profiles[p.species]
    const lateral = Math.max(profile.head, profile.fin, profile.tail * 1.3)
    const radiusFactor = Math.hypot(
        1.15,
        lateral + 0.06 * clamp(p.bodyFlex, 0, 2.5) * clamp(p.tailStrength, 0, 2.5)
    )
    const safeLength = region * 0.44 / (radiusFactor * 1.025)
    const frameLength = Math.min(w, h) * 0.43 / radiusFactor
    return clamp(Math.min(requested, safeLength, frameLength), 0.1, Math.max(0.1, frameLength))
}

function getRadius(s: Shark, p: Props) {
    const profile = profiles[p.species]
    const lateral = Math.max(
        profile.head,
        profile.fin,
        profile.tail * 1.3
    )

    return (
        s.length *
        Math.hypot(
            1.15,
            lateral +
                0.06 *
                    clamp(p.bodyFlex, 0, 2.5) *
                    clamp(p.tailStrength, 0, 2.5)
        )
    )
}

function resetTrail(s: Shark) {
    const trail: Vec[] = []

    for (let i = 0; i <= 130; i++) {
        const d = (i / 130) * s.length * 1.5

        trail.push({
            x: s.x - Math.cos(s.angle) * d,
            y: s.y - Math.sin(s.angle) * d,
        })
    }

    s.trail = trail
}

function sampleTrail(s: Shark, u: number) {
    const target = Math.max(0, u) * s.length
    const points = s.trail

    if (points.length < 2) {
        return {
            x: s.x - Math.cos(s.angle) * target,
            y: s.y - Math.sin(s.angle) * target,
            angle: s.angle,
        }
    }

    let walked = 0

    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const d = distance(a, b)

        if (walked + d >= target) {
            const t = clamp(
                (target - walked) / Math.max(d, 0.00001),
                0,
                1
            )

            return {
                x: mix(a.x, b.x, t),
                y: mix(a.y, b.y, t),
                angle: Math.atan2(a.y - b.y, a.x - b.x),
            }
        }

        walked += d
    }

    const last = points[points.length - 1]
    const before = points[points.length - 2]

    const angle = Math.atan2(
        before.y - last.y,
        before.x - last.x
    )

    const extra = Math.max(0, target - walked)

    return {
        x: last.x - Math.cos(angle) * extra,
        y: last.y - Math.sin(angle) * extra,
        angle,
    }
}

function updateTrail(s: Shark, previous: Vec) {
    const spacing = Math.max(0.25, s.length / 110)
    const moved = distance(previous, s)

    if (moved > 0.0001) {
        const steps = Math.max(
            1,
            Math.min(24, Math.ceil(moved / spacing))
        )

        const points: Vec[] = []

        for (let i = steps; i >= 1; i--) {
            const t = i / steps

            points.push({
                x: mix(previous.x, s.x, t),
                y: mix(previous.y, s.y, t),
            })
        }

        s.trail.unshift(...points)
    } else if (s.trail.length) {
        s.trail[0] = { x: s.x, y: s.y }
    }

    let walked = 0
    let cut = s.trail.length
    const target = s.length * 1.5

    for (let i = 1; i < s.trail.length; i++) {
        const a = s.trail[i - 1]
        const b = s.trail[i]
        const d = distance(a, b)

        if (walked + d >= target) {
            const t = clamp(
                (target - walked) / Math.max(d, 0.00001),
                0,
                1
            )

            s.trail[i] = {
                x: mix(a.x, b.x, t),
                y: mix(a.y, b.y, t),
            }

            cut = i + 1
            break
        }

        walked += d
    }

    s.trail.length = Math.min(cut, 650)
}

function bodyWidth(
    u: number,
    profile: Profile,
    species: Species
) {
    const w = profile.width

    if (
        species === "hammerhead" ||
        species === "greatHammerhead"
    ) {
        if (u < 0.11) {
            return mix(0.045, 0.075 * w, u / 0.11)
        }

        if (u < 0.31) {
            return mix(0.075 * w, 0.135 * w, (u - 0.11) / 0.2)
        }

        if (u < 0.52) {
            return mix(0.135 * w, 0.095 * w, (u - 0.31) / 0.21)
        }

        return (
            0.095 *
            w *
            Math.pow(clamp((1 - u) / 0.48, 0, 1), 1.3)
        )
    }

    if (u < 0.12) {
        return mix(
            profile.nose,
            0.105 * w,
            Math.pow(
                u / 0.12,
                species === "greatWhite" ? 0.75 : 0.95
            )
        )
    }

    if (u < 0.34) {
        return mix(0.105 * w, 0.145 * w, (u - 0.12) / 0.22)
    }

    if (u < 0.55) {
        return mix(0.145 * w, 0.095 * w, (u - 0.34) / 0.21)
    }

    return (
        0.095 *
        w *
        Math.pow(clamp((1 - u) / 0.45, 0, 1), 1.35)
    )
}

function getBodyPoint(
    s: Shark,
    p: Props,
    u: number,
    v: number
): Vec {
    const sample = sampleTrail(s, u)
    const rear = clamp((u - 0.27) / 0.73, 0, 1)

    const wave =
        Math.sin(s.phase - u * 5.2) *
        rear *
        rear *
        s.length *
        0.02 *
        p.bodyFlex *
        p.tailStrength

    const offset = v * s.length + wave

    return {
        x: sample.x - Math.sin(sample.angle) * offset,
        y: sample.y + Math.cos(sample.angle) * offset,    }
}

function createGeometry(s: Shark, p: Props): Geometry {
    const profile = profiles[p.species]
    const path = new Path2D()

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const point = (u: number, v: number) =>
        getBodyPoint(s, p, u, v)

    const polygon = (points: Vec[]) => {
        if (!points.length) return

        path.moveTo(points[0].x, points[0].y)

        for (const pt of points) {
            path.lineTo(pt.x, pt.y)

            minX = Math.min(minX, pt.x)
            minY = Math.min(minY, pt.y)
            maxX = Math.max(maxX, pt.x)
            maxY = Math.max(maxY, pt.y)
        }

        path.closePath()
    }

    const top: Vec[] = []
    const bottom: Vec[] = []

    for (let i = 0; i <= 80; i++) {
        const u = i / 80
        const width = bodyWidth(u, profile, p.species)

        top.push(point(u, width))
        bottom.push(point(u, -width))
    }

    polygon([...top, ...bottom.reverse()])

    for (const side of [-1, 1]) {
        const root = bodyWidth(0.3, profile, p.species)

        polygon([
            point(0.235, side * root * 0.86),
            point(0.29, side * root * 1.12),
            point(0.43, side * profile.fin),
            point(0.53, side * profile.fin * 0.78),
            point(
                0.445,
                side * bodyWidth(0.445, profile, p.species)
            ),
        ])

        polygon([
            point(
                0.64,
                side * bodyWidth(0.64, profile, p.species)
            ),
            point(0.74, side * 0.115),
            point(0.79, side * 0.095),
            point(
                0.76,
                side * bodyWidth(0.76, profile, p.species)
            ),
        ])
    }

    const tailMotion =
        1 +
        Math.sin(s.phase) *
            0.12 *
            clamp(p.tailStrength, 0, 2.5)

    for (const side of [-1, 1]) {
        polygon([
            point(0.87, 0),
            point(0.975, side * profile.tail * 0.75 * tailMotion),
            point(1.04, side * profile.tail * tailMotion),
            point(0.975, side * 0.018),
            point(0.925, 0),
        ])
    }

    if (p.species === "thresher") {
        polygon([
            point(0.9, 0.005),
            point(1.12, profile.tail * 1.18 * tailMotion),
            point(1.04, profile.tail * 0.18),
        ])
    }

    if (
        p.species === "hammerhead" ||
        p.species === "greatHammerhead"
    ) {
        const hw = profile.head

        polygon([
            point(0.025, -hw * 0.96),
            point(0.065, -hw),
            point(0.105, -hw * 0.97),
            point(0.12, -hw * 0.77),
            point(0.13, -0.075),
            point(0.13, 0.075),
            point(0.12, hw * 0.77),
            point(0.105, hw * 0.97),
            point(0.065, hw),
            point(0.025, hw * 0.96),
            point(0.04, hw * 0.68),
            point(0.05, 0.05),
            point(0.05, -0.05),
            point(0.04, -hw * 0.68),
        ])
    }

    return { path, minX, minY, maxX, maxY }
}

function createSharks(p: Props, w: number, h: number): Shark[] {
    const count = clamp(Math.round(p.count), 1, 7)
    const { cols, rows } = getLayout(count)
    const length = getSharkLength(p, w, h)

    const sharks: Shark[] = []

    for (let i = 0; i < count; i++) {
        const angle = hash(i, 4, 9) * TAU

        const s: Shark = {
            id: i,
            x: (((i % cols) + 0.5) * w) / cols,
            y: ((Math.floor(i / cols) + 0.5) * h) / rows,
            angle,
            omega: 0,
            velocity: 0,
            length,
            phase: hash(i, 29, 31) * TAU,
            seed: i * 1327 + 101,
            goal: { x: w / 2, y: h / 2 },
            goalTimer: 0,
            trail: [],
            side: i % 2 ? -1 : 1,
            stuckTime: 0,
        }

        resetTrail(s)
        sharks.push(s)
    }

    return sharks
}

function createFish(p: Props, w: number, h: number): Fish[] {
    const count = p.fish
        ? clamp(Math.round(p.fishCount), 0, 250)
        : 0

    return Array.from({ length: count }, (_, i) => ({
        x: hash(i, 1, 3) * w,
        y: hash(i, 2, 5) * h,
        velocity: (hash(i, 3, 7) - 0.5) * 24,
        phase: hash(i, 4, 9) * TAU,
    }))
}

function chooseGoal(
    s: Shark,
    sharks: Shark[],
    p: Props,
    w: number,
    h: number,
    time: number
) {
    const margin =
        p.boundaryMode === "contained"
            ? Math.min(getRadius(s, p), Math.min(w, h) * 0.47)
            : Math.min(w, h) * 0.1

    const minX = Math.min(margin, w / 2)
    const maxX = Math.max(minX, w - margin)
    const minY = Math.min(margin, h / 2)
    const maxY = Math.max(minY, h - margin)

    let best = { x: w / 2, y: h / 2 }
    let bestScore = -Infinity

    const epoch = Math.floor(time * 0.1) + s.seed

    for (let i = 0; i < 28; i++) {
        const x = mix(minX, maxX, hash(s.seed + i, epoch, 47))
        const y = mix(minY, maxY, hash(s.seed + i, epoch, 59))
        const d = Math.hypot(x - s.x, y - s.y)
        const bearing = Math.atan2(y - s.y, x - s.x)

        let score =
            Math.min(d / Math.max(1, s.length * 2), 2) * 0.8

        score +=
            (1 - Math.abs(angleDelta(s.angle, bearing)) / PI) *
            2.6

        for (const other of sharks) {
            if (other === s) continue

            const spacing =
                (getRadius(s, p) + getRadius(other, p)) *
                clamp(p.separation, 0.5, 5)

            const goalDistance = Math.hypot(
                x - other.x,
                y - other.y
            )

            score +=
                clamp(goalDistance / Math.max(1, spacing), 0, 2) *
                1.5

            if (goalDistance < spacing) {
                score -=
                    (1 - goalDistance / Math.max(1, spacing)) *
                    5
            }
        }

        score += hash(s.seed, i, 73) * 0.3

        if (score > bestScore) {
            bestScore = score
            best = { x, y }
        }
    }

    s.goal = best
    s.goalTimer =
        (10 + hash(s.seed, epoch, 89) * 9) /
        Math.max(0.3, p.roaming)
}

function updateSharks(
    sharks: Shark[],
    p: Props,
    w: number,
    h: number,
    time: number,
    dt: number,
    pointer: { x: number; y: number; active: boolean }
) {
    const speed = Math.max(0, p.speed)

    const plans = sharks.map((s) => {
        s.goalTimer -= dt

        if (
            s.goalTimer <= 0 ||
            distance(s.goal, s) < s.length * 0.6
        ) {
            chooseGoal(s, sharks, p, w, h, time)
        }

        const bearing = Math.atan2(
            s.goal.y - s.y,
            s.goal.x - s.x
        )

        const wander =
            (Math.sin(time * 0.17 + s.seed) * 0.6 +
                Math.sin(time * 0.071 + s.seed * 0.7) * 0.27 +
                Math.sin(time * 0.31 + s.seed * 0.3) * 0.13) *
            p.swimCurvature *
            p.roaming *
            0.16

        let vx = Math.cos(bearing + wander)
        let vy = Math.sin(bearing + wander)
        let risk = 0

        if (p.boundaryMode === "contained") {
            const r = Math.min(
                getRadius(s, p),
                Math.min(w, h) * 0.48
            )

            const look = Math.max(s.length * 2.5, r * 1.8)
            const ax = s.x + Math.cos(s.angle) * look
            const ay = s.y + Math.sin(s.angle) * look

            const wx =
                ax < r ? r - ax : ax > w - r ? w - r - ax : 0
            const wy =
                ay < r ? r - ay : ay > h - r ? h - r - ay : 0

            if (wx || wy) {
                const d = Math.max(0.001, Math.hypot(wx, wy))
                const strength = clamp(d / look, 0, 1)

                vx += (wx / d) * (3.5 + strength * 4)
                vy += (wy / d) * (3.5 + strength * 4)

                vx += (-wy / d) * s.side * 0.8
                vy += (wx / d) * s.side * 0.8

                risk = Math.max(risk, strength)
            }
        }

        for (const other of sharks) {
            if (other === s) continue

            const dx = s.x - other.x
            const dy = s.y - other.y
            const d = Math.max(0.001, Math.hypot(dx, dy))

            const combined =
                (getRadius(s, p) + getRadius(other, p)) *
                clamp(p.separation, 0.5, 5)

            const horizon = clamp(p.avoidanceDistance, 1, 5)

            const fx =
                dx +
                (Math.cos(s.angle) * s.velocity -
                    Math.cos(other.angle) * other.velocity) *
                    horizon

            const fy =
                dy +
                (Math.sin(s.angle) * s.velocity -
                    Math.sin(other.angle) * other.velocity) *
                    horizon

            const predicted = Math.hypot(fx, fy)
            const nearest = Math.min(d, predicted)

            const influence =
                combined * (1.15 + p.avoidanceDistance * 0.2)

            if (nearest >= influence) continue

            const strength =
                1 -
                clamp(
                    (nearest - combined) /
                        Math.max(1, influence - combined),
                    0,
                    1
                )

            const nx = dx / d
            const ny = dy / d

            const separationForce =
                4.5 + p.separation * 1.8

            vx +=
                nx * strength * separationForce -
                ny * s.side * strength * 1.2

            vy +=
                ny * strength * separationForce +
                nx * s.side * strength * 1.2

            risk = Math.max(risk, strength)
        }

        if (p.cursor && pointer.active) {
            const dx = s.x - pointer.x
            const dy = s.y - pointer.y
            const d = Math.max(0.001, Math.hypot(dx, dy))
            const influence = p.cursorRadius + getRadius(s, p)

            if (d < influence) {
                const strength =
                    Math.pow(1 - d / influence, 2) * p.avoidance

                vx += (dx / d) * strength * 4
                vy += (dy / d) * strength * 4

                risk = Math.max(risk, clamp(strength, 0, 1))
            }
        }

        const desired = Math.atan2(vy, vx)

        const turnLimit =
            (0.24 + p.turnSmoothness * 0.05) *
            Math.max(0.4, speed)

        const targetOmega = clamp(
            angleDelta(s.angle, desired) * 0.72,
            -turnLimit,
            turnLimit
        )

        const omega = mix(
            s.omega,
            targetOmega,
            damp(1.55 + risk * 0.7, dt)
        )

        const angle = s.angle + omega * dt

        const cruise =
            Math.max(9, s.length * 0.28) *
            speed *
            (0.84 + hash(s.id, 7, 11) * 0.32)

        const velocity = mix(
            s.velocity,
            cruise * mix(1, 0.86, clamp(risk, 0, 1)),
            damp(1.4, dt)
        )

        return { angle, omega, velocity }
    })

    sharks.forEach((s, i) => {
        const previous = { x: s.x, y: s.y }
        const plan = plans[i]

        s.angle = plan.angle
        s.omega = plan.omega
        s.velocity = plan.velocity

        s.x += Math.cos(s.angle) * s.velocity * dt
        s.y += Math.sin(s.angle) * s.velocity * dt

        if (p.boundaryMode === "contained") {
            const r = Math.min(
                getRadius(s, p),
                Math.min(w, h) * 0.49
            )

            const minX = Math.min(r, w / 2)
            const maxX = Math.max(minX, w - r)
            const minY = Math.min(r, h / 2)
            const maxY = Math.max(minY, h - r)

            const unclampedX = s.x
            const unclampedY = s.y

            s.x = clamp(s.x, minX, maxX)
            s.y = clamp(s.y, minY, maxY)

            const hitWall =
                Math.abs(unclampedX - s.x) > 0.001 ||
                Math.abs(unclampedY - s.y) > 0.001

            if (hitWall) {
                s.goal = { x: w * 0.5, y: h * 0.5 }
                s.goalTimer = 3

                const inward = Math.atan2(
                    h * 0.5 - s.y,
                    w * 0.5 - s.x
                )

                s.omega = clamp(
                    angleDelta(s.angle, inward) * 1.5,
                    -1.6,
                    1.6
                )

                s.angle += s.omega * dt
            }
        } else {
            const margin = getRadius(s, p) * 1.2
            let wrapped = false

            if (s.x < -margin) {
                s.x = w + margin
                wrapped = true
            } else if (s.x > w + margin) {
                s.x = -margin
                wrapped = true
            }

            if (s.y < -margin) {
                s.y = h + margin
                wrapped = true
            } else if (s.y > h + margin) {
                s.y = -margin
                wrapped = true
            }

            if (wrapped) {
                resetTrail(s)
                chooseGoal(s, sharks, p, w, h, time)
                s.stuckTime = 0
                return
            }
        }

        const moved = distance(previous, s)
        const minimumMovement = Math.max(            0.01,
            s.velocity * dt * 0.08
        )

        if (moved < minimumMovement && speed > 0) {
            s.stuckTime += dt
        } else {
            s.stuckTime = Math.max(0, s.stuckTime - dt * 2)
        }

        if (s.stuckTime > 1.4) {
            const inward = Math.atan2(
                h * 0.5 - s.y,
                w * 0.5 - s.x
            )

            s.angle = inward + s.side * 0.35
            s.omega = 0
            s.velocity =
                Math.max(10, s.length * 0.28) * speed

            s.goal = {
                x:
                    w * 0.5 +
                    Math.cos(s.angle) * w * 0.12,
                y:
                    h * 0.5 +
                    Math.sin(s.angle) * h * 0.12,
            }

            s.goalTimer = 4
            s.stuckTime = 0
            s.side *= -1
            resetTrail(s)
        } else {
            updateTrail(s, previous)
        }

        s.phase +=
            dt *
            speed *
            p.tailSpeed *
            (2 + s.velocity / Math.max(1, s.length * 0.28))
    })
}

function moveSharkWithTrail(
    s: Shark,
    dx: number,
    dy: number
) {
    s.x += dx
    s.y += dy

    for (const pt of s.trail) {
        pt.x += dx
        pt.y += dy
    }
}

function resolveSharkCollisions(
    sharks: Shark[],
    p: Props,
    w: number,
    h: number,
    previous?: Vec[]
) {
    if (sharks.length < 2) return
    const padding = 1.025
    for (let iteration = 0; iteration < 16; iteration++) {
        let changed = false
        for (let i = 0; i < sharks.length; i++) {
            for (let j = i + 1; j < sharks.length; j++) {
                const a = sharks[i]
                const b = sharks[j]
                const minimum = (getRadius(a, p) + getRadius(b, p)) * padding
                let dx = b.x - a.x
                let dy = b.y - a.y
                let d = Math.hypot(dx, dy)
                if (d >= minimum - 0.0001) continue
                changed = true
                if (previous) {
                    const pa = previous[i]
                    const pb = previous[j]
                    const oldDistance = Math.hypot(pb.x - pa.x, pb.y - pa.y)
                    if (oldDistance >= minimum - 0.0001) {
                        moveSharkWithTrail(a, pa.x - a.x, pa.y - a.y)
                        moveSharkWithTrail(b, pb.x - b.x, pb.y - b.y)
                        a.goalTimer = 0
                        b.goalTimer = 0
                        a.side *= -1
                        b.side *= -1
                        continue
                    }
                }
                if (d < 0.000001) {
                    const angle = (i + j * 1.618) * 2.39996
                    dx = Math.cos(angle)
                    dy = Math.sin(angle)
                    d = 1
                }
                const nx = dx / d
                const ny = dy / d
                const overlap = minimum - d + 0.001
                let ax = -nx * overlap * 0.5
                let ay = -ny * overlap * 0.5
                let bx = nx * overlap * 0.5
                let by = ny * overlap * 0.5
                if (p.boundaryMode === "contained") {
                    const ra = getRadius(a, p)
                    const rb = getRadius(b, p)
                    const aX = clamp(a.x + ax, ra, Math.max(ra, w - ra))
                    const aY = clamp(a.y + ay, ra, Math.max(ra, h - ra))
                    const bX = clamp(b.x + bx, rb, Math.max(rb, w - rb))
                    const bY = clamp(b.y + by, rb, Math.max(rb, h - rb))
                    ax = aX - a.x
                    ay = aY - a.y
                    bx = bX - b.x
                    by = bY - b.y
                    const remaining = overlap - Math.hypot(bx - ax, by - ay)
                    if (remaining > 0.001) {
                        const canMoveA = Math.hypot(ax, ay) > 0.0001
                        const canMoveB = Math.hypot(bx, by) > 0.0001
                        if (!canMoveA && canMoveB) {
                            bx = clamp(b.x + nx * overlap, rb, Math.max(rb, w - rb)) - b.x
                            by = clamp(b.y + ny * overlap, rb, Math.max(rb, h - rb)) - b.y
                        } else if (!canMoveB && canMoveA) {
                            ax = clamp(a.x - nx * overlap, ra, Math.max(ra, w - ra)) - a.x
                            ay = clamp(a.y - ny * overlap, ra, Math.max(ra, h - ra)) - a.y
                        }
                    }
                }
                moveSharkWithTrail(a, ax, ay)
                moveSharkWithTrail(b, bx, by)
                a.goalTimer = 0
                b.goalTimer = 0
            }
        }
        if (!changed) break
    }
}

function drawOcean(
    ctx: CanvasRenderingContext2D,
    p: Props,
    sharks: Shark[],
    fishes: Fish[],
    w: number,
    h: number,
    dpr: number,
    time: number
) {
    const cell = clamp(p.cellSize, 4, 18)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = getBackground(p)
    ctx.fillRect(0, 0, w, h)

    const cols = Math.ceil(w / cell)
    const rows = Math.ceil(h / cell)
    const [a, b, c] = getColors(p)

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.font =
        `600 ${Math.max(4, cell * 0.8)}px ` +
        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

    if (p.grid) {
        ctx.fillStyle = `rgba(${a.join(",")},0.09)`

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (hash(col, row, 101) > 0.988) {
                    const x = (col + 0.5) * cell
                    const y = (row + 0.5) * cell
                    const r = Math.max(0.7, cell * 0.1)

                    ctx.fillRect(x, y, r, r)
                }
            }
        }
    }

    const glyphs = "@#8%XSt;:."

    for (const s of sharks) {
        const geometry = createGeometry(s, p)
        const pad = cell * 1.5

        const x0 = Math.max(
            0,
            Math.floor((geometry.minX - pad) / cell)
        )

        const x1 = Math.min(
            cols - 1,
            Math.ceil((geometry.maxX + pad) / cell)
        )

        const y0 = Math.max(
            0,
            Math.floor((geometry.minY - pad) / cell)
        )

        const y1 = Math.min(
            rows - 1,
            Math.ceil((geometry.maxY + pad) / cell)
        )

        for (let row = y0; row <= y1; row++) {
            for (let col = x0; col <= x1; col++) {
                const x = (col + 0.5) * cell
                const y = (row + 0.5) * cell

                if (!ctx.isPointInPath(geometry.path, x, y)) {
                    continue
                }

                const h1 = hash(col, row, s.seed)
                const h2 = hash(col, row, s.seed + 17)
                const h3 = hash(col, row, s.seed + 31)

                const field =
                    0.5 +
                    0.5 *
                        Math.sin(
                            col * 0.047 +
                                Math.sin(row * 0.04) * 2.5 +
                                time * 0.14
                        )

                if (
                    h1 >
                    p.density *
                        (1 -
                            p.dissolve *
                                (0.15 + 0.65 * field))
                ) {
                    continue
                }

                const shade =
                    0.36 +
                    0.36 *
                        (0.5 +
                            0.5 *
                                Math.cos(
                                    row * 0.067 -
                                        col * 0.024 +
                                        time * 0.08
                                )) +
                    0.18 * h2 +
                    0.1 *
                        Math.sin(
                            time * 1.2 +
                                col * 0.17 +
                                row * 0.13
                        )

                const brightness = clamp(
                    (shade - 0.5) * p.contrast + 0.5,
                    0,
                    1
                )

                const variation =
                    p.colorVariation *
                    (0.5 +
                        0.5 *
                            Math.sin(
                                col * 0.043 + row * 0.031
                            )) *
                    (0.25 + 0.75 * h3)

                const target = h2 > 0.72 ? c : b

                const red = Math.round(
                    mix(a[0], target[0], variation)
                )

                const green = Math.round(
                    mix(a[1], target[1], variation)
                )

                const blue = Math.round(
                    mix(a[2], target[2], variation)
                )

                const alpha = clamp(
                    (0.16 + brightness * 0.8) * p.opacity,
                    0,
                    1
                )

                const index = Math.min(
                    glyphs.length - 1,
                    Math.floor(
                        clamp(brightness, 0, 0.999) *
                            glyphs.length
                    )
                )

                if (h2 > 0.79) {
                    const tile =
                        cell * mix(0.55, 0.93, brightness)

                    ctx.fillStyle =
                        `rgba(${red},${green},${blue},${alpha * 0.2})`

                    ctx.fillRect(
                        x - tile / 2,
                        y - tile / 2,
                        tile,
                        tile
                    )
                }

                ctx.fillStyle =
                    `rgba(${red},${green},${blue},${alpha})`

                ctx.fillText(
                    glyphs[index],
                    x,
                    y + cell * 0.02
                )
            }
        }
    }

    if (p.fish) {
        ctx.font =
            `500 ${Math.max(5, cell * 0.85)}px monospace`

        for (const f of fishes) {
            ctx.save()
            ctx.translate(f.x, f.y)

            if (f.velocity < 0) ctx.rotate(PI)

            const alpha =
                (0.25 +
                    0.4 * Math.abs(Math.sin(f.phase))) *
                p.opacity

            ctx.fillStyle =
                `rgba(${a.join(",")},${alpha})`

            ctx.fillText("›", 0, 0)
            ctx.restore()
        }
    }
}

class OceanEngine {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    props: Props

    width = 1
    height = 1
    dpr = 1
    time = 0

    sharks: Shark[] = []
    fishes: Fish[] = []

    frameId = 0
    lastFrame = 0
    accumulator = 0

    visible = true
    reduced = false
    disposed = false

    pointer = {
        x: -10000,
        y: -10000,
        active: false,
    }

    resizeObserver?: ResizeObserver
    intersectionObserver?: IntersectionObserver
    mediaQuery?: MediaQueryList

    constructor(canvas: HTMLCanvasElement, props: Props) {
        this.canvas = canvas
        this.props = props

        const ctx = canvas.getContext("2d", { alpha: false })

        if (!ctx) {
            throw new Error("Canvas 2D unavailable")
        }

        this.ctx = ctx

        if (typeof window.matchMedia === "function") {
            this.mediaQuery = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            )

            this.reduced = this.mediaQuery.matches

            if (this.mediaQuery.addEventListener) {
                this.mediaQuery.addEventListener(
                    "change",
                    this.onMotion
                )
            } else {
                this.mediaQuery.addListener(this.onMotion)
            }
        }

        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(this.resize)
            this.resizeObserver.observe(canvas)
        }

        if (typeof IntersectionObserver !== "undefined") {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    this.visible = !!entries[0]?.isIntersecting
                    this.sync()
                },
                { threshold: 0.01 }
            )

            this.intersectionObserver.observe(canvas)
        }

        canvas.addEventListener(
            "pointermove",
            this.onPointerMove,
            { passive: true }
        )

        canvas.addEventListener(
            "pointerleave",
            this.onPointerLeave
        )

        document.addEventListener(
            "visibilitychange",
            this.onVisibility
        )

        window.addEventListener(
            "blur",
            this.onPointerLeave
        )

        this.resize()
    }

    rebuild() {
        this.sharks = createSharks(
            this.props,
            this.width,
            this.height
        )

        this.fishes = createFish(
            this.props,
            this.width,
            this.height
        )

        for (const s of this.sharks) {
            chooseGoal(
                s,
                this.sharks,
                this.props,
                this.width,
                this.height,
                this.time
            )
        }

        resolveSharkCollisions(
            this.sharks,
            this.props,
            this.width,
            this.height
        )
    }

    resize = () => {
        if (this.disposed) return

        const rect = this.canvas.getBoundingClientRect()
        const w = Math.max(1, rect.width)
        const h = Math.max(1, rect.height)

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            clamp(this.props.maxDpr, 1, 2)
        )
        const changed =
            Math.abs(w - this.width) > 0.5 ||
            Math.abs(h - this.height) > 0.5 ||
            !this.sharks.length

        this.width = w
        this.height = h
        this.dpr = dpr

        const pw = Math.max(1, Math.round(w * dpr))
        const ph = Math.max(1, Math.round(h * dpr))

        if (this.canvas.width !== pw) {
            this.canvas.width = pw
        }

        if (this.canvas.height !== ph) {
            this.canvas.height = ph
        }

        if (changed) {
            this.rebuild()
        }

        this.sync(true)
    }

    update(props: Props) {
        const old = this.props
        this.props = props

        if (
            old.count !== props.count ||
            old.size !== props.size ||
            old.species !== props.species ||
            old.boundaryMode !== props.boundaryMode ||
            old.fish !== props.fish ||
            old.fishCount !== props.fishCount
        ) {
            this.rebuild()
        }

        if (old.separation !== props.separation) {
            for (const s of this.sharks) {
                s.goalTimer = 0
            }
        }

        if (old.maxDpr !== props.maxDpr) {
            this.resize()
            return
        }

        if (!props.cursor) {
            this.pointer.active = false
        }

        this.sync(true)
    }

    step(dt: number) {
        const previous = this.sharks.map((s) => ({ x: s.x, y: s.y }))
        updateSharks(
            this.sharks,
            this.props,
            this.width,
            this.height,
            this.time,
            dt,
            this.pointer
        )

        resolveSharkCollisions(
            this.sharks,
            this.props,
            this.width,
            this.height,
            previous
        )

        const speed = Math.max(0, this.props.speed)
        this.time += dt * speed

        for (const f of this.fishes) {
            f.x += f.velocity * dt * speed

            f.y +=
                Math.sin(this.time * 0.6 + f.phase) * dt * 2

            f.phase += dt * speed * 3

            if (f.x < -10) {
                f.x = this.width + 10
            }

            if (f.x > this.width + 10) {
                f.x = -10
            }

            f.y = clamp(
                f.y,
                2,
                Math.max(2, this.height - 2)
            )
        }
    }

    draw() {
        drawOcean(
            this.ctx,
            this.props,
            this.sharks,
            this.fishes,
            this.width,
            this.height,
            this.dpr,
            this.time
        )
    }

    canRun() {
        return (
            !this.disposed &&
            !this.reduced &&
            !this.props.paused &&
            this.props.speed > 0 &&
            this.visible &&
            !document.hidden
        )
    }

    frame = (now: number) => {
        this.frameId = 0

        if (!this.canRun()) return

        const elapsed = Math.min(
            0.08,
            Math.max(0, (now - this.lastFrame) / 1000)
        )

        this.lastFrame = now

        this.accumulator = Math.min(
            0.1,
            this.accumulator + elapsed
        )

        const interval = 1 / clamp(this.props.maxFps, 15, 60)

        if (this.accumulator >= interval) {
            const dt = Math.min(0.08, this.accumulator)
            this.accumulator %= interval

            const steps = Math.max(
                1,
                Math.min(5, Math.ceil(dt / (1 / 60)))
            )

            for (let i = 0; i < steps; i++) {
                this.step(dt / steps)
            }

            this.draw()
        }

        this.frameId = requestAnimationFrame(this.frame)
    }

    sync = (redraw = false) => {
        if (this.disposed) return

        if (redraw) {
            this.draw()
        }

        if (!this.canRun()) {
            if (this.frameId) {
                cancelAnimationFrame(this.frameId)
            }

            this.frameId = 0
            this.accumulator = 0
            return
        }

        if (!this.frameId) {
            this.lastFrame = performance.now()
            this.frameId = requestAnimationFrame(this.frame)
        }
    }

    onVisibility = () => {
        this.sync()
    }

    onMotion = (event: MediaQueryListEvent) => {
        this.reduced = event.matches
        this.sync(true)
    }

    onPointerMove = (event: PointerEvent) => {
        if (
            !this.props.cursor ||
            event.pointerType === "touch"
        ) {
            return
        }

        const rect = this.canvas.getBoundingClientRect()

        this.pointer.x = event.clientX - rect.left
        this.pointer.y = event.clientY - rect.top
        this.pointer.active = true
    }

    onPointerLeave = () => {
        this.pointer.active = false
    }

    destroy() {
        this.disposed = true

        if (this.frameId) {
            cancelAnimationFrame(this.frameId)
        }

        this.resizeObserver?.disconnect()
        this.intersectionObserver?.disconnect()

        if (this.mediaQuery) {
            if (this.mediaQuery.removeEventListener) {
                this.mediaQuery.removeEventListener(
                    "change",
                    this.onMotion
                )
            } else {
                this.mediaQuery.removeListener(this.onMotion)
            }
        }

        this.canvas.removeEventListener(
            "pointermove",
            this.onPointerMove
        )

        this.canvas.removeEventListener(
            "pointerleave",
            this.onPointerLeave
        )

        document.removeEventListener(
            "visibilitychange",
            this.onVisibility
        )

        window.removeEventListener(
            "blur",
            this.onPointerLeave
        )
    }
}

function StaticPreview(p: Props) {
    const count = clamp(Math.round(p.count), 1, 7)
    const { cols, rows } = getLayout(count)
    const size = getSharkLength(p, 800, 450)
    const ink = getColors(p)[0]
    const glyphs = "@#8%XSt;:."
    const cell = clamp(p.cellSize, 4, 18)

    const marks: React.ReactNode[] = []

    for (let i = 0; i < count; i++) {
        const cx = (((i % cols) + 0.5) * 800) / cols

        const cy =
            ((Math.floor(i / cols) + 0.5) * 450) / rows

        const angle = i % 2 ? 0 : PI
        const ca = Math.cos(angle)
        const sa = Math.sin(angle)
        const profile = profiles[p.species]

        const x0 = Math.max(
            0,
            Math.floor((cx - size * 1.5) / cell)
        )

        const x1 = Math.min(
            Math.ceil(800 / cell),
            Math.ceil((cx + size * 1.5) / cell)
        )

        const y0 = Math.max(
            0,
            Math.floor((cy - size * 0.6) / cell)
        )

        const y1 = Math.min(
            Math.ceil(450 / cell),
            Math.ceil((cy + size * 0.6) / cell)
        )

        for (let row = y0; row <= y1; row++) {
            for (let col = x0; col <= x1; col++) {
                const x = (col + 0.5) * cell
                const y = (row + 0.5) * cell

                const dx = x - cx
                const dy = y - cy

                const u = -(dx * ca + dy * sa) / size
                const v = (-dx * sa + dy * ca) / size

                const width =
                    u >= 0 && u <= 1
                        ? bodyWidth(u, profile, p.species)
                        : 0

                const inBody =
                    u >= 0 &&
                    u <= 1 &&
                    Math.abs(v) < width

                const inFin =
                    u > 0.22 &&
                    u < 0.53 &&
                    Math.abs(v) <
                        mix(
                            0.09,
                            profile.fin,
                            Math.sin(((u - 0.22) / 0.31) * PI)
                        )

                const inTail =
                    u > 0.87 &&
                    u < 1.05 &&
                    Math.abs(v) <
                        profile.tail *
                            Math.sin(((u - 0.87) / 0.18) * PI)

                const inHead =
                    profile.head > 0 &&
                    u > 0.02 &&
                    u < 0.13 &&
                    Math.abs(v) < profile.head

                if (!(inBody || inFin || inTail || inHead)) {
                    continue
                }

                const random = hash(col, row, i + 103)

                if (random > p.density) continue

                const shade = hash(col, row, i + 209)

                const index = Math.min(
                    glyphs.length - 1,
                    Math.floor(shade * glyphs.length)
                )

                marks.push(
                    <text
                        key={`${i}-${col}-${row}`}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={`rgb(${ink.join(",")})`}
                        opacity={
                            p.opacity * (0.4 + shade * 0.6)
                        }
                        fontSize={cell * 0.8}
                        fontFamily="monospace"
                        fontWeight="600"
                    >
                        {glyphs[index]}
                    </text>
                )
            }
        }
    }

    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 450"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Karim Saif ASCII Shark Ocean static preview"
            style={{
                display: "block",
                background: getBackground(p),
            }}
        >
            <rect
                width="800"
                height="450"
                fill={getBackground(p)}
            />
            {marks}
        </svg>
    )
}

export default function KarimSaifNaturalASCIISharkOcean(
    props: Props
) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const engineRef = React.useRef<OceanEngine | null>(null)
    const staticMode = useIsStaticRenderer()

    React.useEffect(() => {
        if (
            staticMode ||
            !canvasRef.current ||
            typeof window === "undefined"
        ) {
            return
        }

        const engine = new OceanEngine(
            canvasRef.current,
            props
        )

        engineRef.current = engine

        return () => {
            engine.destroy()

            if (engineRef.current === engine) {
                engineRef.current = null
            }
        }
    }, [staticMode])

    React.useEffect(() => {
        engineRef.current?.update(props)
    }, [
        props.preset,
        props.species,
        props.boundaryMode,
        props.count,
        props.size,
        props.speed,
        props.cellSize,
        props.density,
        props.contrast,
        props.opacity,
        props.background,
        props.primary,
        props.secondary,
        props.accent,
        props.colorVariation,
        props.dissolve,
        props.grid,
        props.fish,
        props.fishCount,
        props.cursor,
        props.cursorRadius,
        props.separation,
        props.avoidance,
        props.avoidanceDistance,
        props.swimCurvature,
        props.roaming,
        props.tailSpeed,
        props.tailStrength,
        props.bodyFlex,
        props.turnSmoothness,
        props.paused,
        props.maxDpr,
        props.maxFps,
    ])

    if (staticMode) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    ...props.style,
                }}
            >
                <StaticPreview {...props} />
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label="Karim Saif Natural ASCII Shark Ocean"
            style={{                display: "block",
                width: "100%",
                height: "100%",
                background: getBackground(props),
                touchAction: "pan-y",
                ...props.style,
            }}
        />
    )
}

KarimSaifNaturalASCIISharkOcean.defaultProps = {
    preset: "reference",
    species: "hammerhead",
    boundaryMode: "contained",
    count: 4,
    size: 1,
    speed: 0.8,
    cellSize: 7,
    density: 0.93,
    contrast: 1.2,
    opacity: 0.85,
    background: "#FFFFFF",
    primary: "#454B54",
    secondary: "#8997AD",
    accent: "#9C8FB0",
    colorVariation: 0.38,
    dissolve: 0.24,
    grid: false,
    fish: true,
    fishCount: 65,
    cursor: true,
    cursorRadius: 180,
    separation: 2,
    avoidance: 2,
    avoidanceDistance: 2.8,
    swimCurvature: 1.5,
    roaming: 1.2,
    tailSpeed: 1,
    tailStrength: 1,
    bodyFlex: 1,
    turnSmoothness: 3,
    paused: false,
    maxDpr: 2,
    maxFps: 60,
}

addPropertyControls(KarimSaifNaturalASCIISharkOcean, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        description: "Choose an ASCII ocean color palette.",
        options: [
            "reference",
            "pearl",
            "chromatic",
            "midnight",
        ],
        optionTitles: [
            "Reference",
            "Pearl",
            "Chromatic",
            "Midnight",
        ],
        defaultValue: "reference",
    },
    species: {
        type: ControlType.Enum,
        title: "Shark Species",
        description: "Select one of eight shark silhouettes.",
        options: [
            "hammerhead",
            "greatHammerhead",
            "greatWhite",
            "tiger",
            "mako",
            "thresher",
            "nurse",
            "zebra",
        ],
        optionTitles: [
            "Hammerhead",
            "Great Hammerhead",
            "Great White",
            "Tiger",
            "Mako",
            "Thresher",
            "Nurse",
            "Zebra",
        ],
        defaultValue: "hammerhead",
    },
    boundaryMode: {
        type: ControlType.Enum,
        title: "Boundary Mode",
        description:
            "Keep sharks inside the frame or allow ocean wrapping.",
        options: ["contained", "free"],
        optionTitles: ["Contained", "Free Ocean"],
        defaultValue: "contained",
    },
    count: {
        type: ControlType.Number,
        title: "Sharks",
        description: "Number of swimming sharks.",
        min: 1,
        max: 7,
        step: 1,
        defaultValue: 4,
        displayStepper: true,
    },
    size: {
        type: ControlType.Number,
        title: "Shark Size",
        description:
            "Scale sharks within the available frame.",
        min: 0.1,
        max: 3.5,
        step: 0.05,
        defaultValue: 1,
    },
    separation: {
        type: ControlType.Number,
        title: "Shark Spacing",
        description:
            "Control the preferred distance between sharks. Higher values keep sharks farther apart.",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 2,
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Overall swimming animation speed.",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        description: "Size of each ASCII character cell.",
        min: 4,
        max: 18,
        step: 1,
        defaultValue: 7,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        description: "Density of ASCII characters inside sharks.",
        min: 0.2,
        max: 1,
        step: 0.01,
        defaultValue: 0.93,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        description: "Contrast of the ASCII mosaic.",
        min: 0.2,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.2,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        description: "Opacity of sharks and background fish.",
        min: 0.1,
        max: 1,
        step: 0.01,
        defaultValue: 0.85,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Ocean background color.",
        defaultValue: "#FFFFFF",
    },
    primary: {
        type: ControlType.Color,
        title: "Primary Ink",
        description:
            "Primary ASCII color in the Reference preset.",
        defaultValue: "#454B54",
    },
    secondary: {
        type: ControlType.Color,
        title: "Secondary Ink",
        description:
            "Secondary ASCII color in the Reference preset.",
        defaultValue: "#8997AD",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent Ink",
        description:
            "Accent ASCII color in the Reference preset.",
        defaultValue: "#9C8FB0",
    },
    colorVariation: {
        type: ControlType.Number,
        title: "Color Variation",
        description: "Variation between selected ink colors.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.38,
    },
    dissolve: {
        type: ControlType.Number,
        title: "Dissolve",
        description: "Amount of fragmented ASCII glyphs.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.24,
    },
    grid: {
        type: ControlType.Boolean,
        title: "Ambient Dots",
        description: "Show subtle background dots.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    fish: {
        type: ControlType.Boolean,
        title: "Small Fish",
        description: "Show small animated ASCII fish.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    fishCount: {
        type: ControlType.Number,
        title: "Fish Count",
        description: "Number of small background fish.",
        min: 0,
        max: 250,
        step: 5,
        defaultValue: 65,
        hidden: (p) => !p.fish,
    },
    cursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        description: "Enable cursor avoidance for sharks.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    cursorRadius: {
        type: ControlType.Number,
        title: "Cursor Radius",
        description: "Radius of cursor influence.",
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 180,
        hidden: (p) => !p.cursor,
    },
    avoidance: {
        type: ControlType.Number,
        title: "Avoidance",
        description: "Strength of cursor avoidance.",
        min: 0.5,
        max: 3,
        step: 0.1,
        defaultValue: 2,
        hidden: (p) => !p.cursor,
    },
    avoidanceDistance: {
        type: ControlType.Number,
        title: "Avoidance Distance",
        description:
            "How far ahead sharks anticipate collisions.",
        min: 1,
        max: 5,
        step: 0.1,
        defaultValue: 2.8,
    },
    swimCurvature: {
        type: ControlType.Number,
        title: "Swim Curvature",
        description: "Natural curvature of swimming paths.",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.5,
    },
    roaming: {
        type: ControlType.Number,
        title: "Roaming",
        description: "How actively sharks explore the ocean.",
        min: 0.3,
        max: 3,
        step: 0.1,
        defaultValue: 1.2,
    },
    tailSpeed: {
        type: ControlType.Number,
        title: "Tail Speed",
        description: "Frequency of tail movement.",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    tailStrength: {
        type: ControlType.Number,
        title: "Tail Strength",
        description: "Strength of tail and body movement.",
        min: 0,
        max: 2.5,
        step: 0.1,
        defaultValue: 1,
    },
    bodyFlex: {
        type: ControlType.Number,
        title: "Body Flex",
        description: "Flexibility of the shark body.",
        min: 0,
        max: 2.5,
        step: 0.1,
        defaultValue: 1,
    },
    turnSmoothness: {
        type: ControlType.Number,
        title: "Turn Smoothness",
        description: "Responsiveness of swimming turns.",
        min: 0.5,
        max: 8,
        step: 0.1,
        defaultValue: 3,
    },
    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        description:
            "Pause animation and retain the current scene.",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max DPR",
        description: "Maximum canvas pixel density.",
        min: 1,
        max: 2,
        step: 0.5,
        defaultValue: 2,
    },
    maxFps: {
        type: ControlType.Number,
        title: "Max FPS",
        description: "Maximum animation frame rate.",
        min: 15,
        max: 60,
        step: 5,
        defaultValue: 60,
    },
})