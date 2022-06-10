import { Effect, R, Ref } from "togii-reactive"
import { ConnectStatus, ServerConnection } from "./connect"

export abstract class Transporter {
    abstract events(): { [key: string]: (connect: ServerConnection, payload: any) => void }
    connections: ServerConnection[] = []
    abstract attach(connect: ServerConnection): void
    abstract isWatch(id: string): boolean

    bind(connect: ServerConnection) {
        if (connect.status !== ConnectStatus.Registed)
            throw new Error('bind: connect is not complete!')
        console.log('bind step 2')
        if (connect.watch.findIndex(v => this.isWatch(v)) >= 0) {
            this.attach(connect)
        }
    }
}
export class ValueTransporter<T extends Object> extends Transporter {

    name: string = ''
    value: Ref<T>
    effect: Effect<T>

    constructor(name: string, value: Ref<T>) {
        super()
        this.name = name
        this.value = value
        this.value.attach(this.effect = R.effect(() => { this.connections.forEach(v => v.send(`changed:${this.name}`, null)) }))
    }

    isWatch(id: string) { 
        console.log('isWatch:'+id)
        return id === `receive-value:${this.name}`
    }

    events() {
        return {
            [`get:${this.name}`]: (connect: ServerConnection) => {
                connect.send(`val:${this.name}`, this.value.val())
            }
        }
    }

    attach(connect: ServerConnection) {
        connect.send(`val:${this.name}`, this.value.val())
        connect.event(this.events())
        this.connections.push(connect)
    }
}
export type Record = { version: string, json: () => any }

export class UpdateTransporter<T extends Record> extends Transporter {
    name: string = ''
    records: T[] = []

    constructor(name: string) {
        super()
        this.name = name
    }

    isWatch(id:string){
        return id === `receive-update:${this.name}`
    }

    events() {
        return {
            ['from:' + this.name]: (connect: ServerConnection, { version }: { version: string }) => {
                const fromIndex = this.records.findIndex(v => v.version === version)
                if (fromIndex < 0) return

                const updation = this.records.filter((_, i) => i > fromIndex).map(v => v.json())

                connect.send(`updation:${this.name}`, {
                    from: version, updation,
                    to: this.records[this.records.length - 1].version,
                })
            }
        }
    }

    update(t: T) {
        this.records.push(t)
        const version = t.version
        this.connections.forEach(v => v.send(`update:${this.name}`, { version }))
    }
    
    attach(connect: ServerConnection) {
        connect.event(this.events())
        this.connections.push(connect)
    }
}