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

    filter(startIndex: number, playedLive: boolean): Playlist
}

export type Collection = { [n: string]: ArchiveTrack }

export interface Archive {
    collection: Collection
    playlists: Array<Playlist>
    format: string
}

export interface Parser {   
    supports(): boolean
    parse() : Archive | null
}

export class CPlaylist implements Playlist {
    name:string 
    tracks: Array<PlaylistTrack>

    constructor(name:string = '', tracks: Array<PlaylistTrack> = []) {
        this.name = name
        this.tracks = tracks
    }

    filter(startIndex: number, playedLive: boolean): Playlist {
        let result = new CPlaylist()
        result.name = this.name
        result.tracks = this.tracks
            .filter((_, index) => index >= (startIndex))
            .filter((track) => playedLive ? track.playedPublic : true)

        return result
    }
}
