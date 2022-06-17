import { ValueTransporter, ServerConnectionStation, UpdateTransporter, Value } from 'togii-server-connect'
import { R } from 'togii-reactive'
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

new ServerConnectionStation({
    wss: new WebSocket.Server({ port: 8080 }),
    transporters: [
        new ValueTransporter('server-time', val),
        new UpdateTransporter('time-color')
    ]
})

setInterval(() => val.update(new TimeValue(new Date())), 1000)