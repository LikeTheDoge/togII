import { R, Ref, Watcher } from "../reactive";
import { StyleOption, stylesheet } from "../stylesheet"
import { get_view_constractor_ids, view_constractor_ids_table } from "./common";
import { LifeCycle } from "./lifecycle";


export class View<SlotIds extends string = never> extends LifeCycle<SlotIds> {
}


export abstract class WatcherView<SlotIds extends string = never> extends View<SlotIds> implements Watcher<any>{


    abstract emit(t: Ref<any>): void 

    recycle() {
        R.recycle(this)
    }

    destroy() {
        super.destroy()
        this.recycle()
    }
}

view_constractor_ids_table.set(View, [])


export const css = <T extends {
    new(...args: any[]): any
}>(
    styleOp: StyleOption,
    selector: string = '',
) => (constractor: T): T => {

    const ids = get_view_constractor_ids(constractor)
    const id = ids[ids.length - 1]
    const eid = (!id) ? '' : `[data-eid-${id}]`

    stylesheet(styleOp, selector, eid)


    return constractor
}