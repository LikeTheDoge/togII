// 渲染节点类型
export enum RenderNodeType {
    TextNode, ElementNode, CommentNode
}

export abstract class RenderNode {
    static nodeId = () => Math.random().toString()
    abstract type: RenderNodeType
    parent?: RenderElementNode
    root: RenderRoot
    nodeId: string = Math.random().toString()
    constructor(root: RenderRoot, id?: string) {
        this.root = root
        this.nodeId = id || this.nodeId
        if (this.root.nodes.has(this.nodeId)) {
            throw new Error(`RenderNode: id ${this.nodeId} is already exist!!!`)
        }
        this.root.nodes.set(this.nodeId, this)
    }
    abstract option(): RenderNodeOption
}

export class RenderTextNode extends RenderNode {
    type: RenderNodeType.TextNode = RenderNodeType.TextNode
    text: string = ''
    option() {
        const { nodeId: id, type, text } = this
        return { id, type, text }
    }
}

export class RenderCommentNode extends RenderNode {
    type: RenderNodeType.CommentNode = RenderNodeType.CommentNode
    text: string = ''
    option() {
        const { nodeId: id, type, text } = this
        return { id, type, text }
    }
}

export class RenderElementNode extends RenderNode {
    type: RenderNodeType.ElementNode = RenderNodeType.ElementNode
    tag: string = 'div'
    attr: { [key: string]: string } = {}
    style: Partial<CSSStyleDeclaration> = {}

    option() {
        const { nodeId: id, type, tag, attr, style } = this
        return { id, type, tag, attr, style, children: [] }
    }
}

export type RenderNodeOption = {
    id: string,
    type: RenderNodeType.TextNode,
    text: string,
} | {
    id: string,
    type: RenderNodeType.CommentNode,
    text: string,
} | {
    id: string,
    type: RenderNodeType.ElementNode,
    tag: string,
    attr: { [key: string]: string },
    style: Partial<CSSStyleDeclaration>
    children: RenderNodeOption[]
}


export class NodeOptionBuilder {
    id: string = Math.random().toString()
    text: string = ''
    tag: string = 'div'
    type: RenderNodeType = RenderNodeType.TextNode
    children: NodeOptionBuilder[] = []

    attr: { [key: string]: string } = {}
    style: Partial<CSSStyleDeclaration> = {}

    static text(text: string, op: { id?: string } = {}) {
        return new NodeOptionBuilder({ text, ...op, type: RenderNodeType.TextNode })
    }
    static comment(text: string, op: { id?: string } = {}) {
        return new NodeOptionBuilder({ text, ...op, type: RenderNodeType.CommentNode })
    }

    static element(tag: string, op: {
        id?: string,
        tag?: string,
        type?: RenderNodeType,
        children?: NodeOptionBuilder[],
        attr?: {
            [key: string]: string,
        }
        style?: Partial<CSSStyleDeclaration>
    } = {}) {
        return new NodeOptionBuilder({ tag, ...op, type: RenderNodeType.ElementNode })
    }

    constructor(option: {
        id?: string,
        text?: string,
        tag?: string,
        type?: RenderNodeType,
        children?: NodeOptionBuilder[],
        attr?: {
            [key: string]: string,
        }
        style?: Partial<CSSStyleDeclaration>
    }) {
        Object.assign(this, option)
    }

    append(...list: NodeOptionBuilder[]) {
        this.children = this.children.concat(list)
        return this
    }

    build(): RenderNodeOption {
        const { id, text, tag, type, children, attr, style } = this
        return { id, text, tag, type, attr, style, children: children.map(v => v.build()) }
    }
}


// 修改节点的操作
export enum RenderOpCode {
    insert = '_insert_',
    cache = '_cache_',
    move = '_move_',
    destory = '_destory_',
    init = '_init_',
    update = '_update_'
}

export type RenderOpInput<T extends RenderOpCode> =
    T extends RenderOpCode.init ? [RenderNodeOption[]] :
    T extends RenderOpCode.insert ? [RenderNodeOption, { before?: string, parent?: string }] :
    T extends RenderOpCode.cache ? [string] :
    T extends RenderOpCode.move ? [string, { before?: string, parent?: string }] :
    T extends RenderOpCode.destory ? [string] :
    T extends RenderOpCode.update ? [RenderNodeOption]
    : never

export type RenderOpInstrction =
    [RenderOpCode.init, ...RenderOpInput<RenderOpCode.init>]
    | [RenderOpCode.init, ...RenderOpInput<RenderOpCode.init>]
    | []


export class RenderRoot {
    nodes: Map<string, RenderNode> = new Map()
    parent: Map<string, string> = new Map()
    childrens: Map<string, string[]> = new Map()
    roots: string[] = []
    cache: string[] = []

    protected get(nodeId: string) {
        const node = this.nodes.get(nodeId)
        if (!node) throw new Error('remove: node is not found!!!')
        return node
    }
    protected clear() {
        this.nodes.clear()
        this.childrens.clear()
        this.roots = []
        this.cache = []
    }
    protected prase(option: RenderNodeOption): RenderNode {
        if (!option || typeof option !== 'object')
            throw new Error('parse: node options error')

        if (option.type === RenderNodeType.ElementNode) {
            const { id, tag = 'div', attr = {}, style = {} } = option
            return Object.assign(new RenderElementNode(this, id), {
                tag, attr, style
            })
        }
        if (option.type === RenderNodeType.TextNode) {
            const { id, text = '' } = option
            return Object.assign(new RenderTextNode(this, id), { text })
        }

        throw new Error('parse: node type error')
    }
    // 将节点插入 node 树中
    protected insert(node: RenderNode, pos: { before?: string, parent?: string }) {
        if (pos.before) {
            if (!this.nodes.has(pos.before))
                throw new Error('error before id !!!')
            const pid = this.parent.get(pos.before)
            if (pid && (this.childrens.get(pid) || []).find(v => v === pos.before)) {
                this.childrens.set(pid, (this.childrens.get(pid) || [])
                    .flatMap(v => v === pos.before ? [node.nodeId, v] : [v])
                )
                this.parent.set(node.nodeId, pid)
                this.nodes.set(node.nodeId, node)
            } else if (this.roots.find(v => v == pos.before)) {
                this.roots = this.roots.flatMap(v => v === pos.before ? [node.nodeId, v] : [v])
                this.nodes.set(node.nodeId, node)
            } else {
                throw new Error('error before parent!!!')
            }
        }
        else if (pos.parent) {
            if (!this.nodes.has(pos.parent))
                throw new Error('error parent id !!!')
            const pid = pos.parent
            this.childrens.set(pid, (this.childrens.get(pid) || []).concat([node.nodeId]))
            this.parent.set(node.nodeId, pid)
            this.nodes.set(node.nodeId, node)
        }
        else {
            this.roots.push(node.nodeId)
            this.nodes.set(node.nodeId, node)
        }
    }
    // 将节点从 node 树中取出
    protected unlink(node: RenderNode) {
        // 从 node 树中取出 node
        const pid = this.parent.get(node.nodeId)
        if (pid) {
            this.childrens.set(pid, (this.childrens.get(pid) || []).filter(id => id !== node.nodeId))
            this.parent.delete(node.nodeId)
        } else {
            this.roots = this.roots.filter(id => id !== node.nodeId)
            this.cache = this.cache.filter(id => id !== node.nodeId)
        }
    }
    [RenderOpCode.init](options: RenderNodeOption[]) {
        this.clear()
        const insertElement = (option: RenderNodeOption, parent?: string) => {
            const ele = this.prase(option)
            this.insert(ele, { parent })
            if (option.type == RenderNodeType.ElementNode) {
                (option.children || []).forEach(op => insertElement(op, ele.nodeId))
            }
        }
        options.forEach(op => insertElement(op))
    }
    [RenderOpCode.insert](...[option, pos]: RenderOpInput<RenderOpCode.insert>) {

        const insert_element = (option: RenderNodeOption, pos: { before?: string, parent?: string } = {}) => {
            const ele = this.prase(option)
            this.insert(ele, pos)
            if (option.type == RenderNodeType.ElementNode) {
                (option.children || []).forEach(op => insert_element(op, { parent: ele.nodeId }))
            }
            return ele
        }

        return insert_element(option, pos).nodeId

    }
    [RenderOpCode.destory](...[nodeId]: RenderOpInput<RenderOpCode.destory>) {
        const node = this.get(nodeId)
        this.unlink(node)
        this.nodes.delete(node.nodeId)
        const children = this.childrens.get(node.nodeId)
        if (children)
            children.forEach(v => this[RenderOpCode.destory](v))
    }
    [RenderOpCode.cache](...[nodeId]: RenderOpInput<RenderOpCode.cache>) {
        const node = this.get(nodeId)
        this.unlink(node)
        this.cache = this.cache.concat(nodeId)
    }
    [RenderOpCode.move](...[nodeId, pos]: RenderOpInput<RenderOpCode.move>) {
        const node = this.get(nodeId)
        this.unlink(node)
        this.insert(node, pos)
    }
    [RenderOpCode.update](...[option]: RenderOpInput<RenderOpCode.update>) {
        const node = this.prase(option)
        if (!this.nodes.has(node.nodeId))
            throw new Error('update: node is not exist!')
        this.nodes.set(node.nodeId, node)
    }

}

export class RenderRootClient extends RenderRoot {
    static document = globalThis.document
    private realNodes: WeakMap<RenderNode, Node> = new WeakMap()
    private container: Element

    constructor(container: Element) {
        super()
        this.container = container
    }
    protected clear() {
        super.clear()
        this.realNodes = new WeakMap()
        const children = Array.from(this.container.childNodes)
        children.forEach(child => this.container.removeChild(child))
    }
    protected prase(option: RenderNodeOption) {
        const node = super.prase(option)
        if (node instanceof RenderTextNode) {
            const real = RenderRootClient.document.createTextNode(node.text)
            this.realNodes.set(node, real)
        } else if (node instanceof RenderCommentNode) {
            const real = RenderRootClient.document.createComment(node.text)
            this.realNodes.set(node, real)
        } else if (node instanceof RenderElementNode) {
            const real = RenderRootClient.document.createElement(node.tag)
            Object.assign(real.style, node.style)
            Object.entries(node.attr).forEach(([key, value]) => {
                real.setAttribute(key, value)
            })
            this.realNodes.set(node, real)
        } 
        return node
    }
    protected unlink(node: RenderNode) {
        super.unlink(node)
        const real = this.realNodes.get(node)
        if (!real)
            throw new Error('unlink: real dom is not found!!!')
        const parent = real.parentNode

        if (parent) {
            parent.removeChild(real)
        }
    }
    protected insert(node: RenderNode, pos: { before?: string, parent?: string }) {
        super.insert(node, pos)

        const real = this.realNodes.get(node)
        if (!real)
            throw new Error('insert: real dom is not found')

        const parent_id = this.parent.get(node.nodeId)
        const is_root = this.roots.findIndex(id => id === node.nodeId) >= 0
        const parent_childrens = parent_id ? this.childrens.get(parent_id)
            : is_root ? this.roots
                : undefined

        const parent_real = parent_id
            ? this.realNodes.get(this.get(parent_id))
            : this.container

        if (!parent_real || !parent_childrens || (parent_childrens.findIndex(id => id === node.nodeId) < 0))
            throw new Error('insert: parent not found')

        const next_id = parent_childrens.find((_, i) => parent_childrens[i - 1] === node.nodeId)
        const next_real = next_id ? this.realNodes.get(this.get(next_id)) : null

        parent_real.insertBefore(real, next_real || null)

    }

}