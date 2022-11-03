export interface ArchiveTrack {
    key: string
    title: string
    artist: string
}
export interface PlayedTime {
    hours: number
    minutes: number
    seconds: number
}
export interface PlayedDate {
    year: number
    month: number
    day: number
}
export interface PlaylistTrack {
    key: string
    collectionEntry: ArchiveTrack
    playedPublic: boolean
    startTime?: PlayedTime
    startDate?: PlayedDate
    startTimeJS?: Date
    timeOffset?: number
    timeOffsetString?: string
}
export interface Playlist {
    name: string
    tracks: Array<PlaylistTrack>
}
export interface Archive {
    collection: { [n: string]: ArchiveTrack }
    playlists: Array<Playlist>
    format: string
}

export interface Parser {    
    supports(contents:string): boolean
    parse(
        contents: string, 
        startTrackIndex: number, 
        onlyPlayedTracks: boolean) : Archive | null
}
