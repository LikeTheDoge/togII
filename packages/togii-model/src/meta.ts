import * as hash from 'object-hash'

export class DataModel { }

export class ModelMeta {

    cls: Function
    parent: ModelMeta | null = null
    label = ''
    fields: Map<string, FieldInfo> = new Map()

    constructor(cls: Function) {
        this.cls = cls
        if (this.cls === DataModel) {
            this.parent = null
        } else if (DataModel.isPrototypeOf(this.cls)) {
            const pa = Object.getPrototypeOf(this.cls)
            this.parent = ModelMeta.get(pa)
        } else {
            throw new Error('request Model class!')
        }
    }
    static all = new Map() as Map<Function, ModelMeta>
    static get(cls: Function) {
        if ((DataModel !== cls) && (!DataModel.isPrototypeOf(cls)))
            throw new Error('request DataModel class!')
        const m = ModelMeta.all.get(cls) || new ModelMeta(cls)
        ModelMeta.all.set(cls, m)
        return m
    }

    private _hash_: string = ''

    hash():string {
        if (this._hash_) return this._hash_
        const _parent_ = this.parent && this.parent.hash()
        const _label_ = this.label
        const kv = Array.from(this.fields.entries())
            .map(([k, v]) => [k, v.type])
            .reduce((r, [k, v]) => Object.assign(r, { [k]: v }), {})

        return this._hash_ = hash({ ...kv, _label_, _parent_ })
    }
}

export enum FieldType {
    null,

    number,
    string,
    boolen,

    kvalue,
    array,
    model,
}

export class FieldInfo {
    key: string = ''
    label: string = ''
    type: FieldType = FieldType.null
}