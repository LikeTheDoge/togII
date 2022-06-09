export const ReactiveBinder = new class {
    refs: WeakMap<Watcher<any>, Ref<any>[]> = new WeakMap()
    watchers: WeakMap<Ref<any>, Watcher<any>[]> = new WeakMap()

    attach<T>(ref: Ref<T>, watcher: Watcher<T>) {
        this.refs.set(watcher,
            (this.refs.get(watcher) || []).concat([ref])
        )
        this.watchers.set(ref,
            (this.watchers.get(ref) || []).concat([watcher])
        )
    }

    detach<T>(ref: Ref<T>, watcher: Watcher<T>) {
        this.refs.set(watcher,
            (this.refs.get(watcher) || []).filter(v => v !== ref)
        )
        this.watchers.set(ref,
            (this.watchers.get(ref) || []).filter(v => v !== watcher)
        )
    }

    recycle(watcher: Watcher<any>) {
        const refs = this.refs.get(watcher) || []
        refs.forEach(ref => this.detach(ref, watcher))
    }
}()


export interface Watcher<T> {
    emit: (r: Ref<T>, old: T) => void
    recycle: () => void
}

export abstract class Ref<T> {
    static onVal: ((ref: Ref<any>) => void)[] = []
    protected abstract value: T
    val() {
        Ref.onVal.forEach(fn => fn(this))
        return this.value
    }

    attach(watcher: Watcher<T>) {
        ReactiveBinder.attach(this, watcher)
    }

    detach(watcher: Watcher<T>) {
        ReactiveBinder.detach(this, watcher)
    }
}

export abstract class Mut<T> extends Ref<T>{
    update(value: T) {
        const old = value
        this.value = value;

        (ReactiveBinder.watchers.get(this) || [])
            .forEach(v => v.emit(this, old))
    }
}

export class Reactive<T> extends Mut<T>{
    protected value: T

    constructor(val: T | Reactive<T>) {
        super()
        if (val instanceof Reactive)
            throw new Error("reactive: can't reactive val twice!")
        this.value = val
    }
}

type StackNode = { current: Watcher<any>, upper: StackNode } | null

Ref.onVal.push((ref) => {
    if (Computed.stack) ReactiveBinder.attach(ref, Computed.stack.current)
})

export class Computed<T> extends Ref<T> implements Watcher<any>{

    static stack: StackNode = null

    protected value: T

    protected fn: () => T

    constructor(fn: () => T) {
        super()
        this.fn = fn
        this.value = this.createValue()
        console.log
    }

    emit() {
        const old = this.value
        this.value = this.createValue();

        (ReactiveBinder.watchers.get(this) || [])
            .forEach(v => v.emit(this, old))
    }

    private createValue() {
        ReactiveBinder.recycle(this)
        Computed.stack = { current: this, upper: Computed.stack }
        const value = this.fn()
        if (!Computed.stack || (Computed.stack.current !== this)) {
            throw new Error('compted bind error!!!')
        } else {
            Computed.stack = Computed.stack.upper
        }
        return value
    }

    recycle() {
        ReactiveBinder.recycle(this)
    }
}

export class Translate<T> extends Mut<T> implements Watcher<any>{

    protected value: T

    protected generateValue: () => T

    protected updateValue: (t: T) => void

    constructor(generateValue: () => T, updateValue: (t: T) => void) {
        super()
        this.generateValue = generateValue
        this.updateValue = updateValue
        this.value = this.createValue()
    }

    emit() {
        super.update(this.createValue())
    }

    private createValue() {
        ReactiveBinder.recycle(this)
        Computed.stack = { current: this, upper: Computed.stack }
        const value = this.generateValue()
        if (!Computed.stack || (Computed.stack.current !== this)) {
            throw new Error('compted bind error!!!')
        } else {
            Computed.stack = Computed.stack.upper
        }
        return value
    }

    recycle() {
        ReactiveBinder.recycle(this)
    }

    update(t: T) {
        this.updateValue(t)
    }

}

export class Effect<T> implements Watcher<T>{

    fn: (val: T) => void
    constructor(fn: (val: T) => void) {
        this.fn = fn
    }

    recycle() { ReactiveBinder.recycle(this) }

    emit(v: Ref<T>) { this.fn(v.val()) }
}

export const R = new class {
    val = <T>(v: T) => new Reactive(v)
    effect = <T>(fn: (val: T) => void) => new Effect(fn)
    recycle = (watcher: Watcher<any>) => { ReactiveBinder.recycle(watcher) }
    compute = <T>(fn: () => T) => new Computed(fn)
    translate = <T>(generate: () => T, update: (t: T) => void) => new Translate(generate, update)
}