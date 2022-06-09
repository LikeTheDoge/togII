import { ClientConnect, ValueReceiver } from 'togii-client-connect'
import { R } from 'togii-reactive'

const svg = `
<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-move"></use>
</svg>
`

document.body.innerHTML = `<h1> ${svg} Hello World ! <b id="time"></b></h1> `


const time = new ValueReceiver('')

time.value.attach(R.effect<string>(time => {
    (document.querySelector('#time') as any).innerHTML = time
}))


new ClientConnect({
    ws: new WebSocket('ws://119.96.83.86:2022/eco-online-edit-server/onLineWebSocket/9/'),
    receivers: [time]
})