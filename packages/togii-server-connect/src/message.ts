import { Effect, R, Ref,Mut } from "togii-reactive"
import { ConnectStatus, ServerConnection } from "./connect"

export abstract class Transporter {
    abstract events(): { [key: string]: (connect: ServerConnection, payload: any) => void }
    connections: ServerConnection[] = []
    attach(connect: ServerConnection): void { console.log(connect) }
    abstract isWatch(id: string): boolean

    bind(connect: ServerConnection) {
        if (connect.status !== ConnectStatus.Registed)
            throw new Error('bind: connect is not complete!')
        if (connect.watch.findIndex(v => this.isWatch(v)) >= 0) {
            connect.event(this.events())
            this.connections.push(connect)
            this.attach(connect)
        }
    }
}


export interface Value<T> {
    version: string
    transportVal(): T
}

export class ValueTransporter<T> extends Transporter {

    name: string = ''
    value: Ref<Value<T>>
    effect: Effect<Value<T>>

    constructor(name: string, value: Ref<Value<T>>) {
        super()
        this.name = name
        this.value = value
        this.value.attach(this.effect = R.effect(() => { this.connections.forEach(v => v.send(`changed:${this.name}`, null)) }))
    }

    isWatch(id: string) {
        return id === `receive-value:${this.name}`
    }

    events() {
        return {
            [`get:${this.name}`]: (connect: ServerConnection) => {
                this.send(connect)
            }
        }
    }

    attach(connect: ServerConnection) {
        this.send(connect)
    }

    private send(connect: ServerConnection) {
        const val = this.value.val()
        connect.send(`val:${this.name}`, { value: val.transportVal(), version: val.version })
    }
}

export interface Update<T> {
    version: string
    transportUpdate(): T
}

export class UpdateTransporter<T> extends Transporter {
    name: string = ''
    records: Update<T>[] = []
    connectionVersion: WeakMap<ServerConnection, string> = new WeakMap()

    constructor(name: string) {
        super()
        this.name = name
    }

    isWatch(id: string) {
        return id === `receive-update:${this.name}`
    }

    events() {
        return {
            ['from:' + this.name]: (connect: ServerConnection, { version }: { version: string }) => {
                const fromIndex = this.records.findIndex(v => v.version === version)
                if (fromIndex < 0) return

                const updation = this.records.filter((_, i) => i > fromIndex).map(v => v.transportUpdate())

                connect.send(`updation:${this.name}`, {
                    from: version, updation,
                    to: this.records[this.records.length - 1].version,
                })
            },
            ['done:' + this.name]: (connect: ServerConnection, { version }: { version: string }) => {
                this.connectionVersion.set(connect, version)
                const head_version_index = this.connections
                    .map(connect => this.connectionVersion.get(connect))
                    .map(version => this.records.findIndex(v => v.version === version))
                    .filter(v => v >= 0)
                    .reduce((res, cur) => res < cur ? res : cur, 0)
                this.records = this.records.filter((_, index) => index >= head_version_index)
            },
        }
    }

    update(t: Update<T>) {
        this.records.push(t)
        const version = t.version
        this.connections.forEach(v => v.send(`update:${this.name}`, { version }))
    }

}


export class ValueUpdateTransporter<T, S> extends Transporter {

    valueTrans: ValueTransporter<T>
    updateTrans: UpdateTransporter<S>

    name: string
    val: Mut<Value<T>>

    constructor(name: string, def: Value<T>) {
        super()
        this.name = name
        this.val = R.val(def)
        this.valueTrans = new ValueTransporter<T>(name, this.val)
        this.updateTrans = new UpdateTransporter<S>(name)

        const version = this.val.val().version
        this.updateTrans.update({ version, transportUpdate() { return null as any } })
    }

    isWatch(id: string) {
        return id === `receive-value&update:${this.name}`
    }

    events() {
        return {
            ...this.valueTrans.events(),
            ...this.updateTrans.events(),
        }
    }

    attach(connect: ServerConnection) {
        this.valueTrans.attach(connect)
        this.updateTrans.attach(connect)
    }

    update(fn: (oldone: Value<T>) => [Value<T>, Update<S>]) {
        const [v,u] = fn(this.val.val())
        if(v.version !== u.version) throw new Error('version is wrong!')
        this.val.update(v)
        this.updateTrans.update(u)
    }

}