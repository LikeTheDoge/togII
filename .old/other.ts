import '../icon.js'

export const icon_complete = new Promise(res => {
    const s = () => {
        if (document.querySelector('#icon-scale'))
            return res(null)
        else
            requestAnimationFrame(s)
    }
    s()
})

export const assert = <T>(v?: T | null) => {
    if (v === undefined || v === null)
        throw new Error('assert error !!!')
    else
        return v
}


export const nextTick = () => new Promise(res => { setTimeout(res, 0) })
