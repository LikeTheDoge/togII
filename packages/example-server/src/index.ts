import { R } from 'togii-reactive'
import { Update, ServerConnectionStation, Value, ValueUpdateTransporter, ValueTransporter } from 'togii-server-connect'
import { RenderRoot, RenderNodeOption, RenderOpCode } from 'togii-node'
import * as WebSocket from 'ws'


class TimeValue implements Value<string>{
    static version = 0
    value: string
    version: string
    constructor(date: Date) {
        this.version = (TimeValue.version++).toString()
        this.value = date.toUTCString()
    }
    transportVal() { return this.value }
}

const val = R.val(new TimeValue(new Date()))

const time = new ValueTransporter('server-time', val)

setInterval(() => {
    val.update(new TimeValue(new Date()))
}, 1000);

class ColorValue implements Value<number>{
    static version = 0
    value: number
    version: string
    constructor(version: string, color: number) {
        this.version = version
        this.value = color
    }
    transportVal() { return this.value }
}

class ColorUpdate implements Update<{ current: number, addition: number }>{

    static version = 0
    addition: number
    current: number
    version: string

    constructor(old: number) {
        this.version = (ColorUpdate.version++).toString()
        this.addition = Math.floor(Math.random() * 0xffffff)
        this.current = (old + this.addition) % 0xffffff
    }

    transportUpdate() {
        return { addition: this.addition, current: this.current }
    }
}

const color = new ValueUpdateTransporter('time-color', new ColorValue(
    (ColorUpdate.version++).toString(),
    0x66ccff)
)

setInterval(() => {
    color.update(old => {
        const update = new ColorUpdate(old.value)
        const curent = new ColorValue(update.version, update.current)
        return [curent, update]
    })
}, 3000)


new ServerConnectionStation({
    wss: new WebSocket.Server({ port: 8080 }),
    transporters: [
        color, time
    ]
})

class RenderRootServer extends RenderRoot implements Value<RenderNodeOption[]>{
    version: string = (0).toString()

    transporter = new ValueUpdateTransporter('app', this)

    current: null | ({ code: RenderOpCode, input: any[] }[]) = null

    emit(code: RenderOpCode, ...input: any[]) {
        if (this.current) {
            this.current.push({ code, input })
        } else {
            this.current = [{ code, input }]
        }
    }
    transportVal() {
        const trans = (ids: string[]): RenderNodeOption[] => {
            return ids.map(id => {
                const node = this.get(id)
                const children = this.childrens.get(id)
                return {
                    ...node.option(),
                    ...(children ? { children: trans(children) } : {})
                }
            })
        }
        return trans(this.roots)
    }
    [RenderOpCode.init](options: any[]) {
        return super[RenderOpCode.init](options)
    }
    [RenderOpCode.insert](option: any, pos: { before?: string, parent?: string } = {}) {
        return super[RenderOpCode.insert](option, pos)
    }
    [RenderOpCode.destory](nodeId: string) {
        return super[RenderOpCode.destory](nodeId)
    }
    [RenderOpCode.cache](nodeId: string) {
        return super[RenderOpCode.cache](nodeId)
    }
    [RenderOpCode.move](nodeId: string, pos: { before?: string, parent?: string } = {}) {
        return super[RenderOpCode.move](nodeId, pos)
    }
    [RenderOpCode.update](option: any) {
        return super[RenderOpCode.update](option)
    }
}

console.log(RenderRootServer)
