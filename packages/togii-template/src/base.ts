import { Ref } from "togii-reactive"

// 模板节点基类
export abstract class TemplateNode { }

// 模板节点群 (递归类型，用于处理 loop / cond 模板语法)
export abstract class TemplateNodeGroup {
}

// 模板文字节点
export class TemplateTextNode extends TemplateNode {
    text: string = ''
}

// 模板元素节点
export class TemplateElementNode extends TemplateNode {
    tag: string = 'div'
    attr: { [key: string]: string } = {}
    prop: { [key: string]: any } = {}
    children: TemplateChildrenGroup = new TemplateChildrenGroup()
}

// 模板元素子节点群
export class TemplateChildrenGroup extends TemplateNodeGroup {
    list: (TemplateNode | TemplateNodeGroup)[] = []
}

// 模板 cond 语法节点
export class TemplateCondGroup extends TemplateNodeGroup {
    cond: Ref<boolean> = null as any
    target: TemplateNode = null as any
}

// 模板 loop 语法节点
export class TemplateLoopGroup<T> extends TemplateNodeGroup {
    array: Ref<T[]> = null as any
    node: (val: T, index: number) => TemplateNode = null as any
    key: (val: T, index: number) => any = null as any
}






