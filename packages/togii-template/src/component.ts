import { TemplateNode, TemplateNodeGroup } from "./base";

type PropValue = { [key: string]: any }

// 模板自定义组件节点
export abstract class TemplateCustomNode<
    Props extends PropValue = {},
    SlotProps extends { [key: string]: PropValue } = {},
    > extends TemplateNode {
    abstract defaultProps: () => Props
    abstract init: (props: Props) => TemplateNode
    abstract slots: { [P in keyof SlotProps]: (input: SlotProps[P]) => TemplateNodeGroup }
}
