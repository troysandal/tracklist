import { Archive, ArchiveTrack, CPlaylist, Parser, Playlist, PlaylistTrack } from "./archive"
import { lineReader } from "./common"

export class M3U8Parser implements Parser {
    static format = "RekordBox M3U8"
    static extensions = ['.m3u8']

    supports(contents: string): boolean {
        return contents.startsWith('#EXTM3U')
    }
    
    parse(contents: string): Archive | null {
        return parseM3U8(contents)
    }  
}

function parseM3U8(
    contents: string) {
    if (!contents.startsWith('#EXTM3U')) {
        return null
    }
    const archive: Archive = {
        collection: {},
        playlists: [] as Array<Playlist>,
        format: 'M3U'
    }
    const playlist = new CPlaylist('Untitled Playlist')
    archive.playlists.push(playlist)
    
    let currentArchiveTrack: ArchiveTrack | undefined
    let currentTrack: PlaylistTrack | undefined

    lineReader(contents, (line) => {
        const regex = /^#EXTINF:(\d+),(([^-]*$)|(.*)( - )(.*))/g
        const match:RegExpExecArray|null = regex.exec(line)

        if (match && match[1]) {
            currentArchiveTrack = {
                key: '__TEMP__',
                title: match[6] || match[3] || '',
                artist: match[4] || ''
            }
            currentTrack = {
                key: currentArchiveTrack.key,
                playedPublic: true,
                collectionEntry: currentArchiveTrack
            }
        } else if (currentTrack && currentArchiveTrack) {
            const key:string = line

            // The line after the EXTINF has the file path which we use as our
            // unique key as the integer after EXTINF is not sufficient.
            currentArchiveTrack.key = key
            currentTrack.key = key

            archive.collection[key] = currentArchiveTrack
            playlist.tracks.push(currentTrack)
        }
    })
    return archive
}
