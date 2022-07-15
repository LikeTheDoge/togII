import { Watcher, ReactiveBinder } from 'togii-reactive'

export abstract class TemplateNode { }
export abstract class TemplateNodeList { }

export class TemplateNodeGroup extends TemplateNodeList {
    list: (TemplateNodeList | TemplateNode)[] = []
}

export class TemplateTextNode extends TemplateNode { }
export class TemplateCommentNode extends TemplateNode { }
export class TemplateComponentNode extends TemplateNode { }
export class TemplateElementNode extends TemplateNode {
    children?: TemplateNodeList
}

export class TemplateCondNode extends TemplateNodeList { }
export class TemplateLoopNode extends TemplateNodeList { }



export class TemplateBinder<T> implements Watcher<T>{
    emit() { }
    recycle() { ReactiveBinder.recycle(this) }
}
