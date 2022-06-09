// 模板节点装饰，用于封装对模板节点的一些绑定操作
export abstract class TemplateDecorator {
    // abstract decorate(ele: TemplateNode): void
}

export  class TemplateNodeAttr extends TemplateDecorator{
    attr:{[key:string]:string} = {}
}

export  class TemplateNodeProp extends TemplateDecorator{
    prop:{[key:string]:any} = {}
}
