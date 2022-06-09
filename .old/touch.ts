import { Point } from "./coordinate"
import { stylesheet } from "./stylesheet"



stylesheet({
    '.mouse-move': {
        'cursor': 'move'
    }
})
export class MouseMovement {

    static create(el?:HTMLElement){
        const move = new MouseMovement()
        if(el) move.target(el)
        return move
    }

    private from?: Point | 'start'
    private now: Point = Point.create(0, 0)
    private el?: HTMLElement

    target(el: HTMLElement) {
        if (this.el) {
            this.el.onmousemove =
                this.el.onmouseup =
                this.el.onmousedown =
                null
        }

        this.el = el
        
        el.onmousedown = () => {
            this.from = 'start'
            this.now = this.getNow()
            el.classList.add('mouse-move')

            el.onmousemove = (e) => {
                if (!this.from)
                    return
                else if (this.from === 'start')
                    this.from = Point.create(e.clientX, e.clientY)
                else {
                    const x = (e.clientX - this.from.x)
                    const y = -(e.clientY - this.from.y)
                    this.move(this.now, Point.create(x, y))
                }
            }
            el.onmouseup = el.onmouseleave = (e) => {
                el.classList.remove('mouse-move')
                el.onmouseover = null
                el.onmouseup = null
                el.onmouseleave = null
                this.from = undefined
            }
        }
    }

    move: (from: Point, move: Point) => void = () => { }
    getNow: () => Point = () => Point.create(0, 0)
}
