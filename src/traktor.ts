import { Archive, ArchiveTrack, Collection, Playlist, CPlaylist, Parser, PlaylistTrack } from "./archive"
import { querySelectorAllParents } from "./common"

export class TraktorParser implements Parser {
    static format = "Traktor"
    static extensions = ['.nml']

    parseXML(contents:string) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(contents, "text/xml")
        const parseError = xmlDoc.getElementsByTagName("parsererror")

        if (parseError.length !== 0) {
            return null
        }
        return xmlDoc
    }

    supports(contents:string): boolean {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return false
        }
        const root = xmlDoc.getElementsByTagName("NML")
        return root.length > 0
    }
    
    parse(contents:string): Archive | null {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return null
        }

        return parseTraktor(xmlDoc)
    }  
}

function parseTraktor(xmlDoc:XMLDocument) {
    const archive: Archive = {
        collection: nmlCollection(xmlDoc),
        playlists: [],
        format: 'Traktor NML'
    }
    archive.playlists = nmlPlaylists(xmlDoc, archive.collection)
    return archive
}

/**
 * Generates the Collection from an NML file.  Only thing to note is that we 
 * are required to generate the track key from LOCATION node's attributes.
 * This is odd because PLAYLIST ENTRY node's PRIMARYKEY already has this 
 * pre-computed.  Unsure why Traktor doesn't do this for COLLECTION ENTRY.
 */
function nmlCollection(xmlDoc: XMLDocument): Collection {
    // Selector we are emulating 'NML > COLLECTION > ENTRY'
    const collectionEntries = querySelectorAllParents(xmlDoc, ['NML', 'COLLECTION', 'ENTRY']) ?? []

    return Array.prototype.map.call(collectionEntries,
        (entry: Element, index: number) => {
            const location = entry.getElementsByTagName('LOCATION')[0] as Element
            const key = 
                `${location.attributes.getNamedItem('VOLUME')?.value}` +
                `${location.attributes.getNamedItem('DIR')?.value}` +
                `${location.attributes.getNamedItem('FILE')?.value}`
            return { 
                title: entry.attributes.getNamedItem('TITLE')?.value, 
                artist: entry.attributes.getNamedItem('ARTIST')?.value,
                key
            }
        })
        .reduce((collection: Collection, track:ArchiveTrack) => {
            collection[track.key] = track; 
            return collection
        }, {})
}

function nmlPlaylists(xmlDoc: XMLDocument, collection:Collection): Playlist[] {
    // Selector we are emulating "NML > PLAYLISTS NODE[TYPE='PLAYLIST']"
    const playlistNodes = querySelectorAllParents(xmlDoc, ['NML', 'PLAYLISTS', "NODE[TYPE='PLAYLIST']"]) ?? []

    return Array.prototype.map.call(playlistNodes, (playlistNode: Element) => {
        const playList = new CTraktorPlaylist(
            playlistNode.attributes.getNamedItem('NAME')?.value,
            []
        )
        const playListTrackNodes = querySelectorAllParents(playlistNode, ['PLAYLIST', 'ENTRY']) ?? []
        playList.tracks = Array.prototype.map.call(playListTrackNodes,
            (entry: Element, index: number) => {
                const keyElement = entry.getElementsByTagName('PRIMARYKEY')[0]
                const key = keyElement?.attributes.getNamedItem('KEY')?.value ?? ''
                const track: PlaylistTrack = {
                    key,
                    collectionEntry: collection[key] as ArchiveTrack,
                    playedPublic: true
                }

                const extendedData = entry.getElementsByTagName('EXTENDEDDATA')[0]
                if (extendedData) {
                    track.playedPublic = !!parseInt(extendedData.attributes.getNamedItem('PLAYEDPUBLIC')?.value ?? '1')
                    const startTime = parseInt(extendedData.attributes.getNamedItem('STARTTIME')?.value ?? '0')
                    track.startTime = NMLTimeToTime(startTime)
                    const startDate = parseInt(extendedData.attributes.getNamedItem('STARTDATE')?.value ?? '0')
                    track.startDate = NMLDateToDate(startDate)
                    track.startTimeJS = new Date(
                        track.startDate.year,
                        track.startDate.month,
                        track.startDate.day,
                        track.startTime.hours,
                        track.startTime.minutes,
                        track.startTime.seconds
                    )
                } 
                return track
            })
        
        return playList
    })
}

class CTraktorPlaylist extends CPlaylist {
    filter(startIndex: number, playedLive: boolean) {
        const result = super.filter(startIndex, playedLive)
        computeTrackOffsets(result)
        return result
    }
}

/**
 * If extendeddata attributes are present in the playlist, computes the offset
 * that the track started at in [HH:]MM:SS format.
 * 
 * @param {PlayList} playList 
 */
function computeTrackOffsets(playList: Playlist) {
    const firstTrack = playList.tracks[0]
    const lastTrack = playList.tracks[playList.tracks.length - 1]

    if (firstTrack && lastTrack && firstTrack?.startTimeJS && lastTrack?.startTimeJS) {
        const start = firstTrack.startTimeJS.getTime()
        const lastTime = lastTrack.startTimeJS.getTime()
        const hasHours = NMLTimeToTime((lastTime - start) / 1000).hours > 0
        
        playList.tracks.forEach((track: PlaylistTrack) => {
            if (track.startTimeJS) {
                track.timeOffset = (track.startTimeJS.getTime() - start) / 1000
                track.timeOffsetString = timeString(track.timeOffset, !hasHours)
            }
        })
    }
}

type NMLDateValue = number

type NMLDate = {
    year: number
    month: number
    day: number
}

// Functions to parse EXTENDEDDATA STARTDATE 
function year (x: NMLDateValue): number { return x >> 16 }
function month(x: NMLDateValue): number { return (x >> 8) % 256 }
function day  (x: NMLDateValue): number { return x % 256 }

function NMLDateToDate(nmlDate: NMLDateValue): NMLDate {
    return {
        year: year(nmlDate),
        month: month(nmlDate),
        day: day(nmlDate)
    }
}
// function DateToNMLDate(date: NMLDate): NMLDateValue {
//     return date.year * 2**16 + date.month * 2**8 + date.day
// }

// Functions to parse EXTENDEDDATA STARTTIME 
type NMLTimeValue = number

type NMLTime = {
    hours: number
    minutes: number
    seconds: number
}

function seconds(t: NMLTimeValue): number { return t % 60 }
function minutes(t: NMLTimeValue): number { return Math.floor((t - 3600*Math.floor(t/3600))/60) }
function hours(t: NMLTimeValue): number { return Math.floor(t/3600) }

function timeString(t: NMLTimeValue, stripHours: boolean): string {
    const HH = hours(t).toString().padStart(2, '0')
    const MM = minutes(t).toString().padStart(2, '0')
    const SS = seconds(t).toString().padStart(2, '0')
    if (stripHours) {
        return `${MM}:${SS}`
    } else {
        return `${HH}:${MM}:${SS}`
    }
}

function NMLTimeToTime(nmlTime: NMLTimeValue): NMLTime {
    return {
        hours: hours(nmlTime),
        minutes: minutes(nmlTime),
        seconds: seconds(nmlTime)
    }
}
