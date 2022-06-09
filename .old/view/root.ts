import { View } from "./index"
import { create_element, DomOption } from "../dom"
import { Update } from "./update"
import { get_view_constractor_ids } from "./common"

export class Root extends Update {

    $root: HTMLElement = document.createElement('div')
    $anchor: Comment | HTMLElement = document.createComment(this.$id)

    private constractor?: { new(): unknown }

    protected children: View[] = []

    protected setRoot(el: DomOption<HTMLElement>) {
        const element = this.createElement(el)
        this.syncUpdate(() => {
            this.$root = element
            const parent = this.$anchor.parentNode
            if (parent) parent.insertBefore(this.$root, this.$anchor)
            this.$anchor = this.$root
        })
        return this
    }

    protected createElement(el: DomOption<HTMLElement>) {
        const constractor = this.constractor || (this.constractor = Object.getPrototypeOf(this).constructor)
        const ids = get_view_constractor_ids(constractor)
        return create_element(el,
            (element) => { 
                ids.forEach(id=> element.setAttribute(`data-eid-${id}`,'') )},
            (child) => { this.children = this.children.concat([child]) }
        )
    }

    destroy() {
        this.$anchor.remove()
        this.children.forEach(v => v.destroy())
    }

    // 外部操作
    parent(p: HTMLElement) {
        this.syncUpdate(() => {
            p.appendChild(this.$anchor)
        })
        return this
    }
    style(css: Partial<CSSStyleDeclaration>) {
        Object.assign(this.$root.style, css)
        return this
    }

}