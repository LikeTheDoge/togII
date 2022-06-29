// 渲染节点类型
export enum RenderNodeType {
    TextNode, ElementNode,
}

// 修改节点的操作
export enum RenderOpCode {
    insert = '_insert_',
    cache = '_cache_',
    move = '_move_',
    destory = '_destory_',
    init = '_init_'
}

export abstract class RenderNode {
    static nodeId = () => Math.random().toString()
    abstract type: RenderNodeType
    parent?: RenderElementNode
    root: RenderRoot
    nodeId: string = Math.random().toString()
    constructor(root: RenderRoot, id?: string) {
        console.log(id)
        this.root = root
        this.nodeId = id || this.nodeId
        if (this.root.nodes.has(this.nodeId)) {
            throw new Error(`RenderNode: id ${this.nodeId} is already exist!!!`)
        }
        this.root.nodes.set(this.nodeId, this)
    }
}

export class RenderTextNode extends RenderNode {
    type = RenderNodeType.TextNode
    text: string = ''

}

export class RenderElementNode extends RenderNode {
    type = RenderNodeType.ElementNode
    tag: string = 'div'
    attr: { [key: string]: string } = {}
    style: Partial<CSSStyleDeclaration> = {}
    // children: RenderNode[] = []
}

type RenderNodeOption = {
    id: string,
    type: RenderNodeType.TextNode,
    text: string,
} | {
    id: string,
    type: RenderNodeType.ElementNode,
    tag: string,
    attr: { [key: string]: string },
    style: Partial<CSSStyleDeclaration>
    children: RenderNodeOption[]
}

export class RenderRoot {
    nodes: Map<string, RenderNode> = new Map()
    parent: Map<string, string> = new Map()
    childrens: Map<string, string[]> = new Map()
    roots: string[] = []
    cache: string[] = []

    private clear() {
        this.nodes.clear()
        this.childrens.clear()
        this.roots = []
        this.cache = []
    }
    private prase(option: RenderNodeOption): RenderNode {
        if (!option || typeof option !== 'object')
            throw new Error('parse: node options error')

        if (option.type === RenderNodeType.ElementNode) {
            const { id, tag = 'div', attr = {}, style = {}, children = [] } = option
            return Object.assign(new RenderElementNode(this, id), {
                tag, attr, style, children: children.map((v: any) => this.prase(v))
            })
        }
        if (option.type === RenderNodeType.TextNode) {
            const { id, text = '' } = option
            return Object.assign(new RenderTextNode(this, id), { text })
        }

        throw new Error('parse: node type error')
    }
    private get(nodeId: string) {
        const node = this.nodes.get(nodeId)
        if (!node) throw new Error('remove: node is not found!!!')
        return node
    }
    // 将节点插入 node 树中
    private insert(node: RenderNode, pos: { before?: string, parent?: string }) {
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
            this.childrens.set(pid, (this.childrens.get(pid) || [])
                .flatMap(v => v === pos.before ? [node.nodeId, v] : [v])
            )
            this.parent.set(node.nodeId, pid)
            this.nodes.set(node.nodeId, node)
        }
        else {
            this.roots.push(node.nodeId)
            this.nodes.set(node.nodeId, node)
        }
        return node
    }
    // 将节点从 node 树中取出
    private unlink(node: RenderNode) {
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
    [RenderOpCode.init](options: any[]) {
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
    [RenderOpCode.insert](option: any, pos: { before?: string, parent?: string } = {}) {

        const insertElement = (option: RenderNodeOption, pos: { before?: string, parent?: string } = {}) => {
            const ele = this.prase(option)
            this.insert(ele, pos)
            if (option.type == RenderNodeType.ElementNode) {
                (option.children || []).forEach(op => insertElement(op, { parent: ele.nodeId }))
            }
            return ele
        }

        return insertElement(option, pos).nodeId

    }

    [RenderOpCode.destory](nodeId: string) {
        const node = this.get(nodeId)
        this.unlink(node)
        this.nodes.delete(node.nodeId)
        const children = this.childrens.get(node.nodeId)
        if (children)
            children.forEach(v => this[RenderOpCode.destory](v))
    }

    [RenderOpCode.cache](nodeId: string) {
        const node = this.get(nodeId)

        this.unlink(node)

        this.cache = this.cache.concat(nodeId)
    }
    [RenderOpCode.move](nodeId: string, pos: { before?: string, parent?: string } = {}) {
        const node = this.get(nodeId)
        this.unlink(node)
        this.insert(node, pos)
    }
}
