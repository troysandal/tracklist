import { Archive, Parser, Playlist, PlaylistTrack } from "./archive"

export class M3UParser implements Parser {
    static format = "M3U"
    static extensions = ['.m3u8']

    supports(contents: string): boolean {
        return contents.startsWith('#EXTM3U')
    }
    
    parse(contents: string, startTrackIndex: number, onlyPlayedTracks: boolean): Archive | null {
        return parseM3U(contents)
    }  
}

function parseM3U(
    contents: string) {
    if (!contents.startsWith('#EXTM3U')) {
        return null
    }
    const archive: Archive = {
        collection: {},
        playlists: [] as Array<Playlist>,
        format: 'M3U'
    }
    const playlist = {
        name: 'Untitled Playlist',
        tracks: [] as Array<PlaylistTrack>
    }
    archive.playlists.push(playlist)

    const lines = contents.split('\n')

    lines.forEach((line) => {
        const regex = /^#EXTINF:(\d+),(([^-]*$)|(.*)( - )(.*))/g
        const match:RegExpExecArray|null = regex.exec(line)
        if (match && match[1]) {
            const collectionEntry = {
                key: match[1],
                title: match[6] || match[3] || '',
                artist: match[4] || ''
            }
            const playlistTrack = {
                key: match[1] || '',
                playedPublic: true,
                collectionEntry
            }
            archive.collection[match[1]] = collectionEntry
            playlist.tracks.push(playlistTrack)
        }
    })
    return archive
}
