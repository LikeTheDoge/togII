import { ValueTransporter, ServerConnectionStation } from 'togii-server-connect'
import { R } from 'togii-reactive'
import * as WebSocket from 'ws'

const val = R.val(new Date().toUTCString())

new ServerConnectionStation({
    wss: new WebSocket.Server({ port: 8080 }),
    transporters: [
        new ValueTransporter('server-time', val)
    ]
})

setInterval(() => val.update(new Date().toUTCString()), 1000)