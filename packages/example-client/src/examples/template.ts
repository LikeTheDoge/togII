import { RenderOpCode, RenderRootClient } from 'togii-node'
import { R, Ref } from 'togii-reactive'
import { TemplateTextNode } from 'togii-template'


document.body.innerHTML = "<div id='app'></div>"

export const root = new RenderRootClient(document.querySelector('#app') as Element)

const text = (str: string | Ref<string>) => new TemplateTextNode(str)


const time = R.val(new Date())
const val_hello = R.compute(() => `hello ${time.val().toUTCString()}`)
const text_hello = text(val_hello)

text_hello.setRoot(root)

root[RenderOpCode.insert](text_hello.render(), {})

setInterval(() => { time.update(new Date()) }, 1000)


interface Creater { }
interface Input { }
interface NodeType {}

class Tag implements Creater { }
class Attr implements Input { }
class Children implements Input { }
class Text implements NodeType{}

type Dom = [Creater,...Input[]] | NodeType

const div = ()=> new Tag()
const attr = (input?:{[key:string]:string})=> new Attr(...([input] as unknown as []))
const $ = ()