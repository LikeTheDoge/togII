import { uuid } from "../uuid"

type Constractor = { new(): any }

export const view_constractor_ids_table: WeakMap<Object, string[]> = new WeakMap()

export const get_view_constractor_ids = (c: Constractor):string[] => {
    // 如果已经注册过
    const s = view_constractor_ids_table.get(c)
    if (s) return s

    // 如果没有注册过 
    const id = uuid()
    const upper = Object.getPrototypeOf(c)
    const upper_ids = upper?get_view_constractor_ids(upper):[]
    view_constractor_ids_table.set(c,upper_ids.concat([id]))

    return upper_ids.concat([id])
}