import { Effect, Ref, Watcher } from "togii-reactive"
import { TemplateNode } from "./base"

// 模板节点装饰，用于封装对模板节点的一些绑定操作
export abstract class TemplateDecorator<T extends TemplateNode = TemplateNode> {

    private target?: T
    decorate(node: T) {
        this.target = node
    }
    protected update() {
        this.target?.update(this)
    }
    abstract watcher: Watcher<any>
    destory() {
        this.watcher.recycle()
    }
}

export class TemplateNodeRefContent extends TemplateDecorator {
    content: Ref<string>
    watcher: Effect<string>
    constructor(content: Ref<string>) {
        super()
        this.content = content
        this.watcher = new Effect<string>(() => {
            this.update()
        })
        this.content.attach(this.watcher)
    }

    get(){return this.content.val()}
}
// 
export class TemplateNodeRefAttr extends TemplateDecorator {
    value: Ref<string>
    filed: string
    watcher: Effect<string>
    constructor(filed: string, value: Ref<string>) {
        super()
        this.filed = filed
        this.value = value
        this.watcher = new Effect<string>(() => {
            this.update()
        })
        this.value.attach(this.watcher)
    }
    get(){
        return {filed:this.filed,value:this.value.val()}
    }
}
// 
export class TemplateNodeRefStyle extends TemplateDecorator {
    value: Ref<string>
    name: string
    watcher: Effect<string>
    constructor(name: string, value: Ref<string>) {
        super()
        this.name = name
        this.value = value
        this.watcher = new Effect<string>(() => {
            this.update()
        })
        this.value.attach(this.watcher)
    }
    get(){
        return {name:this.name,value:this.value.val()}
    }
}

export class TemplateNodeRefProp extends TemplateDecorator {
    value: Ref<any>
    filed: string
    watcher: Effect<any>
    constructor(filed: string, value: Ref<any>) {
        super()
        this.filed = filed
        this.value = value
        this.watcher = new Effect<any>(() => {
            this.update()
        })
        this.value.attach(this.watcher)
    }
    get(){
        return {filed:this.filed,value:this.value.val()}
    }
}