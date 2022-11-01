// https://wiki.hydrogenaud.io/index.php?title=Cue_sheet
export class CUEParser implements Parser {
    static format = "RekordBox CUE"
    static extensions = ['.cue']
    archive: Archive
    playlist: Playlist

    supports(contents: string): boolean {
        // Not the best, file doesn't actually have to havce this but RekordBox
        // does output the REM DATE.
        return contents.startsWith('REM DATE ')
    }
    
    parse(contents: string, startTrackIndex: number, onlyPlayedTracks: boolean): Archive | null {
        this.archive = {
            collection: {},
            playlists: [{
                name: '',
                tracks: [] as Array<PlaylistTrack>
            }] as Array<Playlist>,
            format: CUEParser.format
        }
        this.playlist = this.archive.playlists[0] as Playlist

        let state = this.parseHeader
        const lines = contents.split('\n')
        for (let i = 0 ; i < lines.length ; i++) {
            let nextState = state(lines, i)

        }

        return archive
    }  
    parseHeader(lines:string[], index:number) {
        while (index < lines.length) {
            const line:string = lines[index] as string
            if (line.startsWith('\t')) {
                return index
            }
            /TITLE 
            if (line.startsWith('TITLE ')) {
                this.playlist.name = 
            }
        }
    }
    
    parseTrack(){

    }

    parseTrackDetails(){

    }
}

class Command {
    data:string 
    
    constructor(data:string) {
        this.data = data
    }
    get name():string {
        const match = /(\w+)(\s|$)/g.exec(this.data)
        if (match?.[0]) {
            return match[0]
        }
        return ''
    }
}

function cueReader(contents:string, cb: (command:Command) => void): void {
    const lines = contents.split('\n')
    lines.forEach((line) => {
        if (line.length) {
            cb(new Command(line))
        }
    })
}

type Context = {
    archive:Archive
}

interface State {
    onCommand(context:Context, command:Command): void
}

class HeaderState implements State {
    onCommand(context: Context, command: Command): void {
        throw new Error("Method not implemented.")
    }
}

class PlaylistState implements State {
    onCommand(context: Context, command: Command): void {
        const playlist: Playlist = {
            name: 'foo',
            tracks: []
        }
        context.archive.playlists.push(playlist)
    } 
}

class TrackState implements State {
    onCommand(context: Context, command: Command): void {
        throw new Error("Method not implemented.")
    }
}

let state = new HeaderState()
const context = {archive:null}

cueReader("contents", (command:Command) => {
    if (command.name === "FILE") {
        state = new PlaylistState()
    } else if (command.name === "TRACK") {
        state = new TrackState()
    }
    state.onCommand(context, command)
})

const commands = {
    "REM": () => {},
    "TITLE": () => {},
    "PERFORMER":() => {},
    "FILE": () => 
}