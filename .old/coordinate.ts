import { Simple } from "./object"

export class Point extends Simple<Point>() {

    x: number = 0 // left
    y: number = 0 // top

    static create(x: number, y: number = x) {
        return Point.new({ x, y })
    }
}

export class Matrix3x3 {
    static blank = ()=> new Matrix3x3()

    static mul(
        x1_1: number, x1_2: number, x1_3: number,
        x2_1: number, x2_2: number, x2_3: number,
        x3_1: number, x3_2: number, x3_3: number,
        y1_1: number, y1_2: number, y1_3: number,
        y2_1: number, y2_2: number, y2_3: number,
        y3_1: number, y3_2: number, y3_3: number,
        res: Matrix3x3 = new Matrix3x3()
    ) {
        return res.update(
            x1_1 * y1_1 + x1_2 * y2_1 + x1_3 * y3_1,
            x1_1 * y1_2 + x1_2 * y2_2 + x1_3 * y3_2,
            x1_1 * y1_3 + x1_2 * y2_3 + x1_3 * y3_3,
            x2_1 * y1_1 + x2_2 * y2_1 + x2_3 * y3_1,
            x2_1 * y1_2 + x2_2 * y2_2 + x2_3 * y3_2,
            x2_1 * y1_3 + x2_2 * y2_3 + x2_3 * y3_3,
            x3_1 * y1_1 + x3_2 * y2_1 + x3_3 * y3_1,
            x3_1 * y1_2 + x3_2 * y2_2 + x3_3 * y3_2,
            x3_1 * y1_3 + x3_2 * y2_3 + x3_3 * y3_3,
        )
    }

    val: [
        number, number, number,
        number, number, number,
        number, number, number,
    ] = // 默认单位矩阵
        [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]
    update(
        x0: number, x1: number, x2: number,
        x3: number, x4: number, x5: number,
        x6: number, x7: number, x8: number) {

        this.val[0] = x0
        this.val[1] = x1
        this.val[2] = x2
        this.val[3] = x3
        this.val[4] = x4
        this.val[5] = x5
        this.val[6] = x6
        this.val[7] = x7
        this.val[8] = x8

        return this
    }

}

export abstract class Transfrom {
    static move(offset: Point = Point.create(0)) { return new Move(offset) }
    static scale(ratio: Point = Point.create(1)) { return new Scale(ratio) }
    static rotate(angle: number = 0) { return new Rotate(angle) }

    abstract matrix(res?: Matrix3x3): Matrix3x3
}

export class Move extends Transfrom {
    offset = Point.create(0, 0)

    constructor(pos: Point) {
        super()
        this.offset = pos
    }

    matrix(res: Matrix3x3 = new Matrix3x3()) {
        return Matrix3x3.mul(
            ...res.val,

            1, 0, this.offset.x,
            0, 1, - this.offset.y,
            0, 0, 1,

            res
        )
    }
}

export class Scale extends Transfrom {
    ratio = Point.create(0, 0)


    constructor(ratio: Point) {
        super()
        this.ratio = ratio
    }

    matrix(res: Matrix3x3 = new Matrix3x3()) {
        return Matrix3x3.mul(
            ...res.val,

            this.ratio.x, 0, 0,
            0, this.ratio.y, 0,
            0, 0, 1,

            res
        )
    }


}

export class Rotate extends Transfrom {
    angle: number = 1

    constructor(angel: number) {
        super()
        this.angle = angel
    }

    matrix(res: Matrix3x3 = new Matrix3x3()) {

        const sin = Math.sin(this.angle)
        const cos = Math.cos(this.angle)

        return Matrix3x3.mul(
            ...res.val,

            cos, -sin, 0,
            sin, cos, 0,
            0, 0, 1,

            res
        )
    }

}

// export class XoY {
//     base: Symbol | XoY

//     private transfroms: (Scale | Move)[] = []

//     static from(xoy: XoY) {
//         return new XoY(xoy)
//     }

//     constructor(base: (Symbol | XoY) = Symbol()) {
//         this.base = base
//     }

//     update(t: (Scale | Move)[]) {
//         this.transfroms = t
//         return this
//     }
//     getTransfroms() {
//         return this.transfroms
//     }
// }

