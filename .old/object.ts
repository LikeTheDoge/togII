export const Simple = <T>()=> class{
    static blank(){return new this() as T}
    static new(obj: Partial<T>){return Object.assign(new this(),obj) as T}
}