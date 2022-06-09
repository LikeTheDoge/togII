import { View } from "./view"
import { Root } from "./view/root"
import { Slot } from "./view/slot"

export abstract class DomDecorator {
    abstract decorate(ele: HTMLElement): void
}

type DomCreator<T extends HTMLElement> = () => T

type DomChildren = (DomOption<HTMLElement> | View)[]

export class DomAttrDecorator extends DomDecorator {
    private attrs: ([string, string])[] = []

    constructor(obj: { [key: string]: string }) {
        super()
        this.attrs = Array.from(Object.entries(obj))
    }

    decorate(ele: HTMLElement): void {
        this.attrs.forEach(([name, value]) => { ele.setAttribute(name, value) })
    }
}

export class DomClassListDecorator extends DomDecorator {
    private list: string[] = []

    constructor(list: string[] = []) {
        super()
        this.list = list
    }

    decorate(ele: HTMLElement): void {
        this.list.filter(v => v).forEach((name) => ele.classList.add(name))
    }
}

export class DomIdDecorator extends DomDecorator {
    private id: string

    constructor(id: string) {
        super()
        this.id = id
    }

    decorate(ele: HTMLElement): void {
        ele.id = this.id
    }
}

export class DomStyleDecorator extends DomDecorator {
    private style: Partial<CSSStyleDeclaration> = {}

    constructor(style: Partial<CSSStyleDeclaration>) {
        super()
        this.style = style

    }
    decorate(ele: HTMLElement): void {
        Object.assign(ele.style, this.style)
    }
}

export class DomSlotDecorator extends DomDecorator {

    root: Slot<string>
    slotId: string
    private cntr?: HTMLElement
    private target?: Root | HTMLElement


    constructor(root: Slot<string>, slotId: string) {
        super()
        this.root = root
        this.slotId = slotId
    }

    decorate(ele: HTMLElement): void {
        this.cntr = ele

        if (this.target) {
            this.cntr.appendChild(this.target instanceof Root ? this.target.$anchor : this.target)
        }
    }

    insert(node: Root | HTMLElement) {
        if (this.target) {
            if (this.target instanceof Root) {
                this.target.destroy()
            } else {
                this.target.remove()
            }
        }

        this.target = node

        if (this.cntr) {
            this.cntr.appendChild(this.target instanceof Root ? this.target.$anchor : this.target)
        }
    }

    destroy() {
        if (this.target instanceof Root) this.target.destroy()
    }
}

export class DomRefDecorator extends DomDecorator {

    target: HTMLElement = document.createElement('div')

    decorate(ele: HTMLElement): void { this.target = ele }

}

export type DomOption<T extends HTMLElement> = ([DomCreator<T>, ...(DomDecorator[])])
    | ([DomCreator<T>, ...(DomDecorator[]), DomChildren])

export const div = () => document.createElement('div')
export const canvas = () => document.createElement('canvas')
export const attr = (attrs: { [key: string]: string }) => new DomAttrDecorator(attrs)
export const id = (id: string) => new DomIdDecorator(id)
export const style = (...style: Partial<CSSStyleDeclaration>[]) => new DomStyleDecorator(style.reduce((a, b) => Object.assign(a, b), {}))
export const cls = (...list: string[]) => new DomClassListDecorator(list)

export const refs = <T extends string>(...refs:T[])=>{
    const s = {} as {[key in T]:DomRefDecorator}
    refs.forEach(name=>{
        s[name] = new DomRefDecorator()
    })
    return s
}

export const create_element = <T extends HTMLElement>(
    option: DomOption<T>,
    on_create_element: (e: HTMLElement) => void = () => { },
    on_create_view: (c: View) => void = () => { },
) => {
    const [creator, ...other] = option
    const element = creator()
    on_create_element(element)


    other.forEach(item => {
        if (item instanceof DomDecorator) {
            item.decorate(element)
        }

        if (item instanceof Array) {
            item.forEach(v => {
                if (v instanceof Array) {
                    const ele = create_element(v, on_create_element, on_create_view)
                    element.appendChild(ele)
                }

                if (v instanceof View) {
                    element.appendChild(v.$anchor)
                    on_create_view(v)
                }
            })
        }

    })

    return element
}

