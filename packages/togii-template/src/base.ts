import { Effect, Ref } from "togii-reactive"
import { RenderNodeType, RenderNodeOption, RenderRoot, RenderOpCode } from 'togii-node'
import { TemplateNodeRefContent, TemplateDecorator, TemplateNodeRefAttr, TemplateNodeRefStyle } from "./decorator"

// 模板节点基类
export abstract class TemplateNode {
    id = Math.random().toString()
    root?: RenderRoot
    setRoot(root: RenderRoot) { this.root = root }
    abstract render(): RenderNodeOption
    abstract update(deco: TemplateDecorator): void
}

// 模板节点群 (递归类型，用于处理 loop / cond 模板语法)
export abstract class TemplateNodeGroup {
    abstract render(): RenderNodeOption[]
    root?: RenderRoot
    setRoot(root: RenderRoot) { this.root = root }
}

// 模板文字节点
export class TemplateTextNode extends TemplateNode {
    content: string = ''
    deco?: TemplateNodeRefContent
    constructor(content: string | Ref<string>) {
        super()
        if (content instanceof Ref) {
            this.content = content.val()
            this.deco = new TemplateNodeRefContent(content)
            this.deco.decorate(this)
        } else {
            this.content = content
        }
    }

    render(): RenderNodeOption {
        return { id: this.id, type: RenderNodeType.TextNode, text: this.content }
    }
    update() {
        this.content = this.deco ? this.deco.get() : this.content
        const option: RenderNodeOption = { id: this.id, type: RenderNodeType.TextNode, text: this.content }

        if (this.root) this.root[RenderOpCode.update](option)
    }
}

// 模板注释节点
export class TemplateCommentNode extends TemplateNode {
    content: string = ''
    deco?: TemplateNodeRefContent
    constructor(content: string | Ref<string>) {
        super()
        if (content instanceof Ref) {
            this.content = content.val()
            this.deco = new TemplateNodeRefContent(content)
        } else {
            this.content = content
        }
    }
    render(): RenderNodeOption {
        return { id: this.id, type: RenderNodeType.CommentNode, text: this.content }
    }
    update(): RenderNodeOption {
        this.content = this.deco ? this.deco.get() : this.content
        return { id: this.id, type: RenderNodeType.CommentNode, text: this.content }
    }
}

// 模板元素节点
export class TemplateElementNode extends TemplateNode {
    tag: string = 'div'
    attr: { [key: string]: string } = {}
    style: { [key: string]: string } = {}
    children: TemplateChildrenGroup = new TemplateChildrenGroup()
    decos: (TemplateNodeRefAttr | TemplateNodeRefStyle)[] = []

    constructor({ tag = 'div', attr = {}, style = {} }: {
        tag: string,
        attr: { [key: string]: string | Ref<string> },
        style: { [key: string]: string | Ref<string> },
    }) {
        super()

        this.tag = tag
        this.attr = {}
        this.style = {}
        Object.entries(attr).forEach(([key, value]) => {
            if (typeof value === 'string') {
                this.attr[key] = value
            } else {
                this.attr[key] = value.val()
                const deco = new TemplateNodeRefAttr(key, value)
                deco.decorate(this)
                this.decos.push(deco)
            }
        })
        Object.entries(style).forEach(([key, value]) => {
            if (typeof value === 'string') {
                this.style[key] = value
            } else {
                this.style[key] = value.val()
                const deco = new TemplateNodeRefStyle(key, value)
                deco.decorate(this)
                this.decos.push(deco)
            }
        })
    }

    render(): RenderNodeOption {
        return {
            tag: this.tag,
            id: this.id,
            type: RenderNodeType.ElementNode,
            style: Object.assign({}, this.style),
            attr: Object.assign({}, this.attr),
            children: this.children.render()
        }
    }

    update(deco: TemplateDecorator): void {
        const option: RenderNodeOption = {
            tag: this.tag,
            id: this.id,
            type: RenderNodeType.ElementNode,
            attr: {},
            style: {},
            children: []
        }
        if (deco instanceof TemplateNodeRefAttr) {
            const { filed, value } = deco.get()
            option.attr[filed] = value
        }

        if (deco instanceof TemplateNodeRefStyle) {
            const { name, value } = deco.get()
            option.style[name as any] = value
        }

        if (this.root) this.root[RenderOpCode.update](option)
    }

}

// 模板元素子节点群
export class TemplateChildrenGroup extends TemplateNodeGroup {
    list: (TemplateNode | TemplateNodeGroup)[] = []
    render(): RenderNodeOption[] {
        return this.list.flatMap(v => v instanceof TemplateNode ? [v.render()] : v.render())
    }
}

// 模板 cond 语法节点
export class TemplateCondGroup extends TemplateNodeGroup {
    cond: Ref<boolean> = null as any
    target: TemplateNode = null as any

    render(): RenderNodeOption[] {
        return this.cond.val() ? [this.target.render()] : []
    }
}

// 模板 loop 语法节点
export class TemplateLoopGroup<T> extends TemplateNodeGroup {
    array: Ref<T[]> = null as any
    node: (val: T, index: number) => (TemplateNode | TemplateNodeGroup) = null as any
    key: (val: T, index: number) => any = null as any
    current: (TemplateNode | TemplateNodeGroup)[] = []
    currentKeyMap: Map<any, TemplateNode | TemplateNodeGroup> = new Map()
    watcher:Effect<T[]>

    constructor(array: Ref<T[]>, { node, key }: {
        key: (val: T, index: number) => any,
        node: (val: T, index: number) => (TemplateNode | TemplateNodeGroup),
    }) {
        super()
        this.array = array
        this.key = key
        this.node = node
        this.updateCurrent()
        
        this.watcher = new Effect<any>(() => {
            this.update()
        })
        this.array.attach(this.watcher)
    }

    private updateCurrent() {
        const newCurrentKeyMap: Map<any, TemplateNode | TemplateNodeGroup> = new Map()
        const newCurrent = this.array.val().map((val, index) => {
            const key = this.key(val, index)
            const template = this.currentKeyMap.get(key)
                ?? this.node(val, index)

            newCurrentKeyMap.set(key, template)
            return template
        })
        this.currentKeyMap = newCurrentKeyMap
        this.current = newCurrent
    }


    render() {
        return this.current.flatMap(v => v instanceof TemplateNode ? [v.render()] : v.render())
    }

    update(){
        // this.updateCurrent()

    }
}






