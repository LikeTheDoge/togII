import { Simple } from "./object"

export class Size extends Simple<Size>(){
    height: number = 100
    width: number = 100

    static create(width: number, height: number) {
        return  Size.new({ width, height })
    }

    static window(){
        return Size.new({width:window.innerWidth,height:window.innerHeight})
    }
}

export class Positon extends Simple<Positon>(){
    top: number = 0
    left: number = 0

    static create(top: number = 0, left: number = 0) {
        return Positon.new({ top, left })
    }
}

