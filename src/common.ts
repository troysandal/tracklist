export function lineReader(contents:string, cb: (line:string, index:number) => void): void {
    const lines = contents.split('\n')
    lines.forEach((line, index) => {
        line = line.trim()
        if (line.length) {
            cb(line, index)
        }
    })
}
