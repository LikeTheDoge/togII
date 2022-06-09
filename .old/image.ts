import { Simple } from "./object"
import { Size } from "./position"

export class Img extends Simple<Img>(){
    size: Size = Size.create(0, 0)
    name: string = ''
    target: HTMLImageElement = new Image()

    static src(src: string) {

        return new Promise<Img>((res, rej) => {
            const name = src
            const target = new Image()
            const size = Size.create(0, 0)
            target.src = src

            
            target.onload = () => {
                size.width = target.width
                size.height = target.height

                res(Img.new({ name, target, size }))
            }

            target.onerror = (e) => {
                rej(e)
            }
        })
    }
}
