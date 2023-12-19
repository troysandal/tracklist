import { Playlist } from "./parsers/archive"

export const DEFAULT_FORMAT_STRING = '${INDEX}. ${TITLE} - ${ARTIST}'

export const TRACK_FIELDS = {
    INDEX: (playList:Playlist, trackIndex:number, formatString:string): string => {
        return formatString.replace('${INDEX}', `${trackIndex + 1}`)
    },
    INDEX_PADDED: (playList:Playlist, trackIndex:number, formatString:string): string => {
        const padding = playList.tracks.length.toString().length
        return formatString.replace('${INDEX_PADDED}', (trackIndex + 1).toString().padStart(padding, '0'))
    },
    TITLE: (playList:Playlist, trackIndex:number, formatString:string): string => {
        return formatString.replace('${TITLE}', playList.tracks?.[trackIndex]?.collectionEntry.title || 'Unknown Title')
    },
    ARTIST: (playList:Playlist, trackIndex:number, formatString:string): string => {
        return formatString.replace('${ARTIST}', playList.tracks?.[trackIndex]?.collectionEntry.artist || 'Unknown Artist')
    },
    OFFSET: (playList:Playlist, trackIndex:number, formatString:string): string => {
        const substitution = playList.tracks[trackIndex]?.timeOffsetString ?? ''
        return formatString.replace('${OFFSET}', substitution)
    }
}

export function format(playList:Playlist, trackIndex:number, formatString:string): string {
    Object.values(TRACK_FIELDS).forEach((trackKey) => { 
        formatString = trackKey(playList, trackIndex, formatString)
    })
    return formatString
}

export function buildTags(playlist: Playlist): string[] {
    const tags = playlist.tracks
      .map((track) => track.collectionEntry.artist)
      .map((artist) => artist.split(','))
      .flat()
      .map((artist) => artist.replace(/\(.*$/g, ''))
      .map((artist) => artist.split('&'))
      .flat()
      .map((artist) => artist.trim().replace(/\s+/g, ''))
      .map((artist) => `#${artist.toLocaleLowerCase()}`)

    return [...new Set(tags)]
  }

/**
 * Converts a playlist to a human readable form.
 * 
 * @param {Playlist} playlist  Playlist to turn into a human readable string.
 */
export function playlistToReadable(playlist:Playlist, FORMAT_STRING:string): string {
    const result = []

    result.push('Artist Tags')
    result.push(buildTags(playlist).join(' '))
    result.push('')

    result.push(playlist.name)

    playlist.tracks
        .map((track, index) => result.push(format(playlist, index, FORMAT_STRING)))

    return result.join('\n')
}
