export function lineReader(contents:string, cb: (line:string, index:number) => void): void {
    const lines = contents.split('\n')
    lines.forEach((line, index) => {
        line = line.trim()
        if (line.length) {
            cb(line, index)
        }
    })
}

/**
 * JSDom.querySelectorAll no work with 'TAG > TAG' selectors so we got this.
 */
 export function querySelectorAllParents(xmlDoc: Element | XMLDocument | undefined, parents:string[]) {
    while (xmlDoc && parents[0]) {
        const tagName = parents.shift() as string
        const isLastTag = parents.length === 0
        const children = xmlDoc.querySelectorAll(tagName)

        if (isLastTag) {
            return children
        }
        xmlDoc = children[0]
    }

    return undefined
}

