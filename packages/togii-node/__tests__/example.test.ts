import { expect, test } from '@jest/globals';
import { RenderElementNode, RenderNodeType, RenderOpCode, RenderRoot, RenderTextNode } from '../src/render'

test('text', () => {
    const root = new RenderRoot()

    const nid = root[RenderOpCode.insert]({ type: RenderNodeType.TextNode, text: "hello", id: '0' })
    const node = root.nodes.get(nid)

    expect(nid).toBe('0')
    expect(node).toBeInstanceOf(RenderTextNode)
    expect((node as RenderTextNode).text).toBe('hello')

});

test('element', () => {
    const root = new RenderRoot()

    const nid = root[RenderOpCode.insert]({
        type: RenderNodeType.ElementNode, tag: "div", id: '0',
        attr: { title: 'world' }, style: { color: 'red' },
        children: [
            { type: RenderNodeType.TextNode, text: "world", id: '1' },
            {
                type: RenderNodeType.ElementNode, tag: "div", id: '2',
                attr: { title: '!' }, style: { color: 'green' },
            }
        ]
    })
    const node0 = root.nodes.get('0') as RenderElementNode
    const node1 = root.nodes.get('1') as RenderTextNode
    const node2 = root.nodes.get('2') as RenderElementNode

    expect(nid).toBe('0')
    expect(node0).toBeInstanceOf(RenderElementNode)
    expect(node1).toBeInstanceOf(RenderTextNode)
    expect(node2).toBeInstanceOf(RenderElementNode)

    expect(node0.tag).toBe('div')
    expect(node0.style.color).toBe('red')
    expect(node0.attr.title).toBe('world')

    expect(node1.text).toBe('world')

    expect(node2.tag).toBe('div')
    expect(node2.style.color).toBe('green')
    expect(node2.attr.title).toBe('!')

    expect((root.childrens.get(node0.nodeId) || []).find(id => id === '1'))
        .toBe(node1)

    expect((root.childrens.get(node0.nodeId) || []).find(id => id === '2'))
        .toBe(node2)
});

// test('insert & destory & cache', () => {
//     const root = new RenderRoot()
//     const parentId = root[RenderOpCode.insert](
//         { tag: 'div', type: RenderNodeType.ElementNode }
//     )

//     expect(root.roots.find(id => id === parentId)).toBe(parentId)

//     expect(() => {
//         root[RenderOpCode.insert](
//             { id: parentId, type: RenderNodeType.ElementNode }
//         )
//     }).toThrow(Error)

//     expect(() => {
//         root[RenderOpCode.insert](
//             { tag: 'div' }
//         )
//     }).toThrow(Error)

//     const childId0 = root[RenderOpCode.insert](
//         { text: 'world !', type: RenderNodeType.TextNode },
//         { parent: parentId }
//     )
//     console.log('children',childId0)
//     const childNode0 = root.nodes.get(childId0)

//     expect((root.childrens.get(parentId) || []).find(id => id === childId0)).toBe(childId0)

//     const childId1 = root[RenderOpCode.insert](
//         { text: 'hello ', type: RenderNodeType.TextNode },
//         { before: childId0 }
//     )

//     expect(
//         (root.childrens.get(parentId) || []).findIndex(id => id === childId0)
//         - (root.childrens.get(parentId) || []).findIndex(id => id === childId1)
//     ).toBe(1)


//     expect(() => {
//         root[RenderOpCode.insert](
//             { text: 'hello ', type: RenderNodeType.TextNode },
//             { parent: 'childId0' }
//         )
//     }).toThrow(Error)

//     root[RenderOpCode.cache](childId0)

//     expect((root.childrens.get(parentId) || []).findIndex(id => id === childId0)).toBe(-1)
//     expect(root.cache.find(id => id === childId0)).toBe(childNode0)

//     root[RenderOpCode.destory](parentId)
//     expect(root.nodes.get(parentId)).toBeUndefined()
//     expect(root.nodes.get(childId1)).toBeUndefined()
//     expect(root.nodes.get(childId0)).toBeDefined()

//     expect(() => {
//         root[RenderOpCode.move](parentId)
//     }).toThrow(Error)

//     root[RenderOpCode.move](childId0)
//     expect(root.cache.find(id => id === childId0)).toBeUndefined()
//     expect(root.roots.find(id => id === childId0)).toBeDefined()

// })
