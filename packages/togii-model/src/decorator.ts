import { FieldInfo, FieldType, ModelMeta } from './meta'

export const field = (label: string, type: FieldType) => ({ constructor: cls }: { constructor: Function }, key: string) => {
    ModelMeta.get(cls).fields.set(key, Object.assign(new FieldInfo(), { key, label, type }))
}


export const label = (label:string) => (cls: Function ) => {
    ModelMeta.get(cls).label = label
}
