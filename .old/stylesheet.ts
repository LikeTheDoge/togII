
export type StyleRules = Partial<CSSStyleDeclaration> & { $next?: StyleOption }

export type StyleOption = { [selector: string]: StyleRules }

export const stylesheet = (s: StyleOption, upper: string = '', common: string = '') => {

    const e = document.createElement('style')
    const sel = (selector: string, common: string) => {
        const s = selector[0] === '&'
            ? selector.replace('&', '')
            : ' ' + selector
        const [header, ...other] = s.split(':')

        if (other.length <= 0) {
            return s + common
        } else {
            return header + common + ':' + other.join(':')
        }

    }

    Array.from(Object.entries(s)).forEach(([selector, values]) => {
        const html = `
        ${upper}${sel(selector,common)} {${Array.from(Object.entries(values))
                .filter(v => typeof v[1] === 'string')
                .map(([name, value]) => `
            ${name.replace(/[A-Z]/g, s => '-' + s.toLocaleLowerCase())}:${value};`).join('')}
        }`
        e.innerHTML += html

        if (values.$next) { stylesheet(values.$next, `${upper}${sel(selector,'')}`), common }
    })

    document.head.appendChild(e)
}
