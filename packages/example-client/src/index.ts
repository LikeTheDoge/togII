import { ClientConnect, ValueReceiver } from 'togii-client-connect'
import { R } from 'togii-reactive'

const svg = `
<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-move"></use>
</svg>
`

document.body.innerHTML = `<h1> ${svg} Hello World ! <b id="time"></b></h1> `


const time = new ValueReceiver('server-time','')

time.key = 'server-time'

time.value.attach(R.effect<string>(t => {
    console.log(time);
    (document.querySelector('#time') as any).innerHTML = t
}))


new ClientConnect({
    ws: new WebSocket('ws://localhost:8080/'),
    receivers: [time]
})

