import { Slot } from "./slot";

export class LifeCycle<SlotIds extends string = never> extends Slot<SlotIds>{

    done: Promise<any>

    constructor() {
        super()
        this.done = this.asyncUpdate(() => this.created())
        // Promise.all([this.done].concat(this.children.map(v => v.done)))
        //     .then(() => this.completed())
    }

    protected created(): Promise<void> | void { }

    protected completed() { }

    protected destroyed() { }

    destroy(): void {
        super.destroy()
        this.destroyed()
    }
}