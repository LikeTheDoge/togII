import { expect, test } from '@jest/globals';
import { DataModel, FieldInfo, ModelMeta } from '../src/meta'

test("test unknown class meta", () => {
    const t = () => {
        class A { }
        new ModelMeta(A);
    };
    expect(t).toThrow(Error);
});

test("test DataModel meta", () => {
    expect(new ModelMeta(DataModel).label).toBe('');
    expect(new ModelMeta(DataModel).parent).toBe(null);
    expect(new ModelMeta(DataModel).hash()).toHaveLength(40);
});

test("test DataModel chilren class meta", () => {
    class A extends DataModel { }
    expect(new ModelMeta(A).label).toBe('');
    expect(new ModelMeta(A).parent).toStrictEqual(new ModelMeta(DataModel))
    expect(new ModelMeta(A).hash()).toHaveLength(40);
})

test('test Meta static methods', () => {

    expect(() => ModelMeta.get(class A { })).toThrow(Error)

    expect(ModelMeta.get(DataModel) instanceof ModelMeta).toBe(true);

    class Data extends DataModel { }
    expect(ModelMeta.get(Data) instanceof ModelMeta).toBe(true);
    ModelMeta.get(Data).fields.set('key',Object.assign(new FieldInfo()))
    
    expect(ModelMeta.get(Data).hash()).toHaveLength(40);

});