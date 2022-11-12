import { Archive, ArchiveTrack, CPlaylist, Parser, Playlist, PlaylistTrack } from "./archive"
import { lineReader } from "./common"

type Headers = {[n: string]: number}

export class RekordBoxTXTParser implements Parser {
    static format = "RekordBox TXT"
    static extensions = ['.txt']
    private contents: string

    constructor(contents:string) {
        this.contents = contents
    }
    supports(): boolean {
        return this.contents.trim().startsWith('#\t')
    }
    
    parse(): Archive | null {
        const archive = {
            collection: {},
            playlists: [],
            format: 'CUE'
        } as Archive
        const playlist: Playlist = new CPlaylist()

        textReader(this.contents, (archiveTrack:ArchiveTrack) => {
            const playlistTrack: PlaylistTrack = {
                key: archiveTrack.key,
                collectionEntry: archiveTrack,
                playedPublic: true
            }
            archive.collection[archiveTrack.key] = archiveTrack
            if (!playlist.tracks.length) {
                archive.playlists.push(playlist)
            }
            playlist.tracks.push(playlistTrack)
        })

        return archive
    }
}

const TXT_MAP = {
    TITLE: 'TRACK TITLE',
    ARTIST: 'ARTIST',
    KEY: '#'
}

function getField(name:string, headers:Headers, fields: Array<string>): string|null {
    const fieldIndex = headers[name]

    if (fieldIndex !== undefined && fields[fieldIndex]) {
        return fields[fieldIndex] as string
    }
    return null
}

function textReader(contents:string, cb:(track:ArchiveTrack) => void) {
    let headers: Headers = {}

    lineReader(contents, (line:string, index:number) => {
        const fields = line.split('\t')

        if (index === 0) {
            headers = fields.reduce((headers:Headers, cur:string, index:number) => {
                headers[cur.toUpperCase()] = index
                return headers
            }, headers)
        } else {
            cb({
                key: getField(TXT_MAP.KEY, headers, fields) ?? `${Math.random()}`,
                title: getField(TXT_MAP.TITLE, headers, fields) ?? '',
                artist: getField(TXT_MAP.ARTIST, headers, fields) ?? ''
            })
        }
    })
}