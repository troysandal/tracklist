interface ArchiveTrack {
    key: string
    title: string
    artist: string
}
interface PlayedTime {
    hours: number
    minutes: number
    seconds: number
}
interface PlayedDate {
    year: number
    month: number
    day: number
}
interface PlaylistTrack {
    key: string
    collectionEntry: ArchiveTrack
    playedPublic: boolean
    startTime?: PlayedTime
    startDate?: PlayedDate
    startTimeJS?: Date
    timeOffset?: number
    timeOffsetString?: string
}
interface Playlist {
    name: string
    tracks: Array<PlaylistTrack>
}
interface Archive {
    collection: { [n: string]: ArchiveTrack }
    playlists: Array<Playlist>
    format: string
}

interface Parser {    
    supports(contents:string): boolean
    parse(
        contents: string, 
        startTrackIndex: number, 
        onlyPlayedTracks: boolean) : Archive | null
}
