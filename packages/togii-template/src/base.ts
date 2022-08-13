import { Ref } from "togii-reactive"
import { RenderNodeType, RenderNodeOption, RenderRoot, RenderOpCode } from 'togii-node'
import { TemplateNodeRefContent, TemplateDecorator, TemplateNodeRefProp, TemplateNodeRefAttr } from "./decorator"

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
    prop: { [key: string]: any } = {}
    children: TemplateChildrenGroup = new TemplateChildrenGroup()
    decos: (TemplateNodeRefAttr | TemplateNodeRefProp)[] = []

    render(): RenderNodeOption {
        return {
            tag: this.tag,
            id: this.id,
            type: RenderNodeType.ElementNode,
            attr: Object.assign({}, this.attr),
            style: {},
            children: []
        }
    }

    update(deco: TemplateDecorator): RenderNodeOption {
        if (deco instanceof TemplateNodeRefAttr) {
            const { filed, value } = deco.get()
            this.attr[filed] = value
        }
        if (deco instanceof TemplateNodeRefProp) {
            const { filed, value } = deco.get()
            this.prop[filed] = value
        }
        return {
            tag: this.tag,
            id: this.id,
            type: RenderNodeType.ElementNode,
            attr: Object.assign({}, this.attr),
            style: {},
            children: []
        }
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
        return [this.target.render()]
    }
}

// 模板 loop 语法节点
export class TemplateLoopGroup<T> extends TemplateNodeGroup {
    array: Ref<T[]> = null as any
    node: (val: T, index: number) => (TemplateNode | TemplateNodeGroup) = null as any
    key: (val: T, index: number) => any = null as any

    current: (TemplateNode | TemplateNodeGroup)[] = []
    render() {
        return this.current.flatMap(v => v instanceof TemplateNode ? [v.render()] : v.render())
    }
}






