import { Transporter } from "./message";
import * as WebSocket from 'ws'
import { ServerConnection } from ".";





export class ServerConnectionStation {


    connections: ServerConnection[] = []
    transporters: Transporter[] = []
    wss: WebSocket.Server<WebSocket.WebSocket>


    constructor({ wss, transporters }: { wss: WebSocket.Server<WebSocket.WebSocket>, transporters: Transporter[] }) {
        this.wss = wss
        this.transporters = transporters
        this.init()
    }

    private init() {
        this.wss.on('connection', ws => this.createConnection(ws))
    }

    private async createConnection(ws: WebSocket) {
        console.log('bind step 0')
        const connection = await new ServerConnection(ws).complete()
        this.connections.push(connection)
        console.log('bind step 1')
        this.transporters.forEach(v=>v.bind(connection))
    }

}