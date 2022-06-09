import { DomSlotDecorator, DomOption } from "../dom"
import { Root } from "./root"

export class Slot<SlotIds extends string = never> extends Root {

    // slot
    protected slotTable: { [key: string]: DomSlotDecorator } = {}

    protected slot(sid: SlotIds): DomSlotDecorator {
        return this.slotTable[sid] ?? (this.slotTable[sid] = new DomSlotDecorator(this, sid))
    }

    destroy(): void {
        super.destroy()
        Array.from(Object.values(this.slotTable)).forEach(v=>v.destroy())
    }

    insert(sid: SlotIds, node: Root | DomOption<HTMLElement>) {
        const ele = node instanceof Array ? this.createElement(node) : node
        this.syncUpdate(() => {
            const pa = this.slotTable[sid]
            if (pa instanceof DomSlotDecorator) {
                pa.insert(ele)
            }
        })
        return this
    }
    
}
