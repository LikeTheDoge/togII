import { ClientConnect, ValueReceiver, ValueUpdateReceiver } from 'togii-client-connect'
import { RenderRootClient, RenderOpCode,NodeOption } from 'togii-node'
import { R } from 'togii-reactive'

const svg = `
<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-move"></use>
</svg>
`

document.body.innerHTML = `
    <h1> ${svg} Hello World ! <b id="time" style="transition:all 3s ease"></b></h1>
    <div id="app"></div>
    `


const time = new ValueReceiver('server-time', '')

time.key = 'server-time'

time.value.attach(R.effect<string>(t => {
    (document.querySelector('#time') as any).innerHTML = t
}))

const color = new ValueUpdateReceiver(
    'time-color', 0xcccccc,
    (value: number, _: number) => {
        return value
    },
    (update: { current: number, addition: number }, old: number) => {
        const { current, addition } = update
        const c = (old + addition) % 0xffffff
        console.log(c, current)
        return current
    }
)

color.value.attach(R.effect<number>(t => {
    console.log(color);
    (document.querySelector('#time') as any).style.color = '#' + t.toString(16)
}))

new ClientConnect({
    ws: new WebSocket('ws://localhost:8080/'),
    receivers: [time, color],
})

const cntr = document.querySelector('#app')
if (cntr) {
    const root = new RenderRootClient(cntr)
    root[RenderOpCode.init]([
        NodeOption.element('div',{
            id:'2',
            style:{color:'red'}
        })
        .append(NodeOption.text('world !'))
        .build()
    ])

    root[RenderOpCode.insert](NodeOption.text('hello '),{
        before:'2'
    })

}

