import { CPlaylist } from "./archive"

export class TraktorParser {
    static format = "Traktor"
    static extensions = ['.nml']

    parseXML(contents) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(contents, "text/xml")
        const parseError = xmlDoc.getElementsByTagName("parsererror")

        if (parseError.length !== 0) {
            return null
        }
        return xmlDoc
    }

    supports(contents) {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return false
        }
        const root = xmlDoc.getElementsByTagName("NML")
        return root.length > 0
    }
    
    parse(contents) {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return null
        }

        return parseTraktor(xmlDoc)
    }  
}

function parseTraktor(xmlDoc) {
    const archive = {
        collection: nmlCollection(xmlDoc),
        playlists: [],
        format: 'Traktor NML'
    }
    archive.playlists = nmlPlaylists(xmlDoc, archive.collection)
    return archive
}

/**
 * Returns the NML COLLECTION as a map from track KEY to a track object which has shape
 * {title:'track name', artist:'Artist', key:'UID'} for every unique track that appears in 
 * any of the playlists in the file. The track key is built from it's LOCATION node
 * which is used to map to Playlist items.
 * 
 * @param {XMLDocument} xmlDoc 
 * @returns Map of track keys to collection item.
 */
function nmlCollection(xmlDoc) {
    return Array.prototype.map.call(xmlDoc
        .querySelectorAll("NML > COLLECTION > ENTRY"),
        (entry, index) => {
            const track = { 
                title: entry.attributes['TITLE']?.value, 
                artist: entry.attributes['ARTIST']?.value
            }
            const location = entry.querySelectorAll('LOCATION')[0]
            track.key = location.attributes['VOLUME'].value +
                location.attributes['DIR'].value +
                location.attributes['FILE'].value
            track.key = track.key
            return track
        })
        .reduce((collection, track) => {collection[track.key] = track; return collection}, {})
}

/**
 * Returns an array of playlists that are present in the NML.  Each entry is an object
 * with shape shown below.  The order of the `tracks` array is the order in which the
 * tracks were sorted in the Traktor UI. `startTrackIndex` is useful when your playlist
 * has a ton of tracks you previewed before you went live.  None of them wound up 
 * in the mix so you don't want them in your playlist.  You'd think you could
 * just delete these in Traktor Explorer -> Archive -> History but no.
 *
 * {
 *   name: 'My Playlist',
 *   tracks: [{
 *       key: 'track_key'
 *       // Only if EXTENDEDDATA present.
 *       startTime: 123
 *       startDate: 1234
 *       playedPublic: true
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {XMLDocument} xmlDoc
 * @param {Collection} Collection from nmlCollection(xmlDoc)
 * @returns Array of playlists.
 */
function nmlPlaylists(xmlDoc, collection) {
    const playlistNodes = xmlDoc.querySelectorAll("NML PLAYLISTS NODE[TYPE='PLAYLIST']")

    var playlists = Array.prototype.map.call(playlistNodes, (playlistNode) => {
        const playList = new CTraktorPlaylist(
            playlistNode.attributes['NAME']?.value,
            []
        )
        playList.tracks = Array.prototype.map.call(playlistNode.querySelectorAll('PLAYLIST > ENTRY'),
            (entry, index) => {
                const track = { }
                const key = entry.getElementsByTagName('PRIMARYKEY')[0]
                track.key = key.attributes['KEY'].value
                track.collectionEntry = collection[track.key]

                const extendedData = entry.getElementsByTagName('EXTENDEDDATA')[0]
                if (extendedData) {
                    track.playedPublic = !!parseInt(extendedData.attributes['PLAYEDPUBLIC'].value)
                    const startTime = parseInt(extendedData.attributes['STARTTIME'].value)
                    track.startTime = NMLTimeToTime(startTime)
                    const startDate = parseInt(extendedData.attributes['STARTDATE'].value)
                    track.startDate = NMLDateToDate(startDate)
                    track.startTimeJS = new Date(
                        track.startDate.year,
                        track.startDate.month,
                        track.startDate.day,
                        track.startTime.hours,
                        track.startTime.minutes,
                        track.startTime.seconds
                    )
                } else {
                    track.playedPublic = true
                }
                return track
            })
        
        return playList
    })
    return playlists
}

class CTraktorPlaylist extends CPlaylist {
    filter(startIndex, playedLive) {
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
function computeTrackOffsets(playList) {
    // Don't compute if EXTENDEDDATA does not exist
    if (!playList.tracks[0]?.startTimeJS) {
        return
    }

    const start = playList.tracks[0].startTimeJS
    const lastTime = playList.tracks[playList.tracks.length - 1].startTimeJS
    // TOOD - Use startTimeJS
    const hasHours = NMLTimeToTime((lastTime - start) / 1000).hours > 0
    const hasHoursTest = 0 < Math.floor((lastTime - start) / 3600 / 1000)
    console.assert(hasHours === hasHoursTest, `${hasHours} === ${hasHoursTest}`)
    
    playList.tracks.forEach((track) => {
        track.timeOffset = (track.startTimeJS - start) / 1000
        track.timeOffsetString = timeString(track.timeOffset, !hasHours)
    })
}


// Functions to parse EXTENDEDDATA STARTDATE 
function year(x) { return x >> 16 }
function month(x) { return (x >> 8) % 256 }
function day(x) { return x % 256 }

function NMLDateToDate(nmlDate) {
    return {
        year: year(nmlDate),
        month: month(nmlDate),
        day: day(nmlDate)
    }
}
function DateToNMLDate(date) {
    return date.year * 2**16 + date.month * 2**8 + date.day
}

// Functions to parse EXTENDEDDATA STARTTIME 
function seconds(t) { return t % 60 }
function minutes(t) { return Math.floor((t - 3600*Math.floor(t/3600))/60) }
function hours(t) { return Math.floor(t/3600) }

function timeString(t, stripHours) {
    const HH = hours(t).toString().padStart(2, '0')
    const MM = minutes(t).toString().padStart(2, '0')
    const SS = seconds(t).toString().padStart(2, '0')
    if (stripHours) {
        return `${MM}:${SS}`
    } else {
        return `${HH}:${MM}:${SS}`
    }
}

function NMLTimeToTime(nmlTime) {
    return {
        hours: hours(nmlTime),
        minutes: minutes(nmlTime),
        seconds: seconds(nmlTime)
    }
}
