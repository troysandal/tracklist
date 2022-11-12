import {Parser, Archive, Playlist, PlaylistTrack, ArchiveTrack, CPlaylist} from './archive'
import {lineReader} from './common'

// https://wiki.hydrogenaud.io/index.php?title=Cue_sheet
export class CUEParser implements Parser {
    static format = "RekordBox CUE"
    static extensions = ['.cue']
    private contents: string

    constructor(contents:string) {
        this.contents = contents
    }

    supports(): boolean {
        // Not the best, file doesn't actually have to havce this but RekordBox
        // does output the REM DATE.
        return this.contents.startsWith('REM DATE ')
    }
    
    parse(): Archive | null {
        return cueParser(this.contents)
    }
}

export class Command {
    data:string 
    
    constructor(data:string) {
        this.data = data
    }

    get name():string {
        const match = /(\w+)(\s|$)/g.exec(this.data)
        if (match?.[1]) {
            return match[1].toUpperCase()
        }
        return ''
    }

    stringParam() :string|undefined {
        // Quoted Strings
        const QUOTED = /^\s*(\w+)\s"(.*)"/
        let match = QUOTED.exec(this.data)
        if (match?.[2]) {
            return match[2]
        }
        // Embedded Quotes
        match = /^\s*\w+\s(.*)$/.exec(this.data)
        if (match?.[1]) {
            return match[1]
        }
        return undefined
    }
    param(index:number): string|undefined {
        const lines = this.data.split(' ')
        return lines[index]
    }
}

type Context = {
    archive: Archive,
    header: HeaderState
}

interface State {
    onCommand(context: Context, command:Command): void
    onNextState(context: Context, command:Command): State
}

class HeaderState implements State {
    title: string|undefined
    performer: string|undefined

    onCommand(context: Context, command: Command): void {
        switch (command.name) {
            case 'TITLE':
                this.title = command.stringParam()
                break
            case 'PERFORMER':
                this.performer = command.stringParam()
                break
        }
    }
    onNextState(context: Context, command: Command): State {
        if (command.name === 'FILE') {
            return new PlaylistState()
        }
        return this
    }
}

class PlaylistState implements State {
    onCommand(context: Context, command: Command): void {
        const nameFields = [context.header.title, context.header.performer]
            .filter((field) => field)
        const playlist: Playlist = new CPlaylist(nameFields.join(' - '))

        context.archive.playlists.push(playlist)
    } 
    onNextState(context: Context, command: Command): State {
        if (command.name === 'TRACK') {
            return new TrackState(context, command.param(1))
        }
        return this
    }
}

class TrackState implements State {
    id: string

    constructor(context:Context, id:string|undefined) {
        this.id = id  ?? '' + Math.random()
        const collectionTrack:ArchiveTrack = {
            key: this.id,
            title: '',
            artist: ''
        }
        const playlist = context.archive.playlists[context.archive.playlists.length - 1]
        const playlistTrack: PlaylistTrack = {
            key: collectionTrack.key,
            collectionEntry: collectionTrack,
            playedPublic: true
        }
        playlist?.tracks.push(playlistTrack)
    context.archive.collection[collectionTrack.key] = collectionTrack
    }

    playlist(context: Context, ): Playlist {
        return context.archive.playlists[context.archive.playlists.length - 1] as Playlist
    }

    playlistTrack(context: Context, ): PlaylistTrack {
        const playlist: Playlist = this.playlist(context)
        return playlist.tracks[playlist.tracks.length - 1] as PlaylistTrack
    }

    collectionTrack(context: Context, ): ArchiveTrack {
        const playlistTrack = this.playlistTrack(context)
        return context.archive.collection[playlistTrack.key] as ArchiveTrack
    }

    onCommand(context: Context, command: Command): void {
        const collectionTrack = this.collectionTrack(context)

        switch (command.name) {
            case 'TITLE':
                collectionTrack.title = command.stringParam() ?? ''
                break
            case 'PERFORMER':
                collectionTrack.artist = command.stringParam() ?? ''
                break
        }
    }
    onNextState(context: Context, command: Command): State {
        if (command.name === 'TRACK') {
            return new TrackState(context, command.param(1))
        }
        return this
    }
}

export function cueReader(contents:string, cb:(command:Command) => void) {
    lineReader(contents, (commandString:string, index:number) => {
        const command:Command = new Command(commandString)
        cb(command)
    })
}

export function cueParser(contents:string):Archive {
    let state:State = new HeaderState()
    const context:Context = {
        archive:{
            collection: {},
            playlists: [],
            format: 'CUE'
        } as Archive,
        header: state as HeaderState
    }

    cueReader(contents, (command:Command) => {
        state.onCommand(context, command)
        state = state = state.onNextState(context, command)
    })

    return context.archive
}