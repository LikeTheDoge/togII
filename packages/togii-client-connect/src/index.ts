import { R, Mut } from 'togii-reactive'

enum ClientConnectStatus {
    blank,
    created,
    inited,
    registed,
}

export class ClientConnect {

    connectId: string = ''
    status: ClientConnectStatus = ClientConnectStatus.blank
    ws: WebSocket
    receivers: Receiver[]
    listener: Map<string, (payload: any) => void> = new Map()

    constructor({ ws, receivers }: { ws: WebSocket, receivers: Receiver[] }) {
        this.ws = ws
        this.receivers = receivers
        this.create()
    }

    private create() {
        this.ws.onmessage = (message: MessageEvent<any>) => {
            const data = message.data
            if (typeof data !== 'string')
                return // todo: 异常处理
            const { event, payload } = JSON.parse(data.toString())
            const listeners = [
                this.listener,
                ...this.receivers.map(v => v.listener)
            ]
            listeners.forEach(listener => {
                const func = listener.get(event)
                if (func) func(payload)
            })
        }
        this.status = ClientConnectStatus.created
        this.init()
    }

    private init() {
        this.on('init', (connectId: string) => {
            this.connectId = connectId
            this.status = ClientConnectStatus.inited
            this.off('init')
            this.regist()
        })
    }

    private regist() {
        this.go('regist', this.receivers.flatMap(v => v.watchIds()))
        this.waitDone.forEach(resolve => resolve(this))
        this.status = ClientConnectStatus.registed
        this.receivers.forEach(v=>v.install(this))
    }

    private on(event: string, fn: (payload: any) => void) {
        this.listener.set(event, fn)
    }

    private off(event: string) {
        this.listener.delete(event)
    }

    private waitDone: ((value: ClientConnect | PromiseLike<ClientConnect>) => void)[] = []

    complete() {
        if (this.status === ClientConnectStatus.registed)
            return Promise.resolve(this)
        else
            return new Promise<ClientConnect>(res => this.waitDone.push(res))
    }

    private go(event: string, payload: any) {
        this.ws.send(JSON.stringify({ event, payload }))
    }

    async send(event: string, payload: any) {
        await this.complete()
        this.ws.send(JSON.stringify({ event, payload }))
    }

}

export abstract class Receiver {

    key: string = ''

    connect?: ClientConnect

    listener: Map<string, Function> = new Map()

    abstract watchIds(): string[]
    abstract install(connect: ClientConnect): void

    protected on(event: string, fn: Function) {
        this.listener.set(event, fn)
    }

    protected off(event: string) {
        this.listener.delete(event)
    }

    protected send(event: string, payload: any) {
        this.connect?.send(event, payload)
    }

}

export class ValueReceiver<T> extends Receiver {
    name: string = ''
    value: Mut<T>

    constructor(name:string, def: T) {
        super()
        this.name = name
        this.value = R.val<T>(def)
    }

    watchIds() {
        return [`receive-value:${this.name}`]
    }


    install(connect: ClientConnect) {
        console.log('install',connect)
        this.connect = connect
        this.on(`changed:${this.name}`, () => { this.onchange(this) })
        this.on(`val:${this.name}`, ({value}: {value:T}) => { this.value.update(value) })
    }

    update() {
        this.send(`get:${this.name}`, null)
    }

    onchange: (_this: ValueReceiver<T>) => void = (_this) => {
        _this.update()
    }

}

export class UpdateReceiver<T> extends Receiver {

    name: string = ''
    version: string = ''

    watchIds() {
        return [`receive-update:${this.name}`]
    }

    install(connect: ClientConnect) {
        this.connect = connect
        this.on(`update:${this.name}`, ({ version }: { version: string }) => {
            if (this.version == version) return
            this.send(`from:${this.name}`, { version: this.version })
        })
        this.on(`updation:${this.name}`, ({ to, from, updation }: { from: string, to: string, updation: T[] }) => {
            if (this.version == from)
                return
            this.version = to
            this.onupdate(this, updation)
        })
    }

    onupdate: (_this: UpdateReceiver<T>, list: T[]) => void = () => { }
}