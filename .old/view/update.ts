import { Base } from "./base"

export class Update extends Base {

    protected waiting?: Promise<this>
    protected afterWaiting: (() => void)[] = []
    // 更新
    protected stopWaiting(p: Promise<this>) {
        if (this.waiting !== p) return
        this.waiting = undefined
        this.afterWaiting.forEach(v => v())
    }

    protected asyncUpdate(fn: () => void) {
        const waiting = Promise.resolve(this.waiting)
            .then(() => (fn(), this))
            // .finally(() => this.stopWaiting(waiting))

        this.waiting = waiting
        return waiting
    }

    protected syncUpdate(fn: () => void) {
        if (this.waiting) {
            this.afterWaiting.push(fn)
        } else {
            fn()
        }
    }
}