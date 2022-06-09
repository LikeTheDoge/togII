import { expect, test } from '@jest/globals';
import { Computed, Effect, R, Reactive, ReactiveBinder, Translate } from '../src/index'

test("reactive: can't reactive val twice!", () => {
    expect(() => new Reactive(new Reactive(null)))
        .toThrow(Error)
});

test("effect", () => {
    const r = new Reactive('1')
    let val = r.val()

    expect(val).toBe('1')

    const eff = new Effect<string>(v => { val = v })
    ReactiveBinder.attach(r, eff)
    r.update('2')

    expect(val).toBe('2')
    expect(r.val()).toBe('2')
});

test("compute", () => {
    const r = new Reactive(1)
    const c = new Computed(() =>r.val() + 1)
    expect(c.val()).toBe(2)

    r.update(2)
    expect(c.val()).toBe(3)

    c.recycle()
    expect(ReactiveBinder.watchers.get(r)).toHaveLength(0)
})

test("translate", () => {
    const r = new Reactive(1)
    const c = new Translate(
        () => r.val() + 1,
        (v: number) => r.update(v - 1)
    )

    expect(c.val()).toBe(2)

    r.update(2)

    expect(c.val()).toBe(3)

    c.update(10)

    expect(c.val()).toBe(10)

    expect(r.val()).toBe(9)

    c.recycle()

    expect(ReactiveBinder.watchers.get(r)).toHaveLength(0)
})

test("R",()=>{
    const v = R.val(1)
    expect(v).toBeInstanceOf(Reactive)

    const e = R.effect((v:number)=> console.log(v))
    expect(e).toBeInstanceOf(Effect)

    v.attach(e)
    expect(ReactiveBinder.watchers.get(v)).toHaveLength(1)

    v.detach(e)
    expect(ReactiveBinder.watchers.get(v)).toHaveLength(0)

    v.attach(e)
    e.recycle()
    expect(ReactiveBinder.watchers.get(v)).toHaveLength(0)
})