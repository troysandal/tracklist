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
    return $(xmlDoc)
        .find("COLLECTION ENTRY")
        .map((index, entry) => {
            const track = { 
                title: entry.getAttribute('TITLE'), 
                artist: entry.getAttribute('ARTIST')
            }
            const location = $(entry).find('LOCATION')
            track.key = location.attr('VOLUME') + location.attr('DIR') + location.attr('FILE')
            track.key = track.key
            return track
        })
        .toArray()
        .reduce((prev, curr) => {prev[curr.key] = curr; return prev}, {})
}

/**
 * Returns an array of playlists that are present in the NML.  Each entry is an object
 * with shape shown below.  The order of the `tracks` array is the order in which the
 * tracks were sorted in the Traktor UI.
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
    const playlistNodes = $(xmlDoc).find("NODE[TYPE=PLAYLIST]")

    var playlists = playlistNodes.map((_,playlistNode) => {
        const playList = {
            name: playlistNode.getAttribute('NAME'),
            tracks: []
        }
        playList.tracks = $('PLAYLIST ENTRY', playlistNode)
            .map((index, entry) => {
                const track = { }
                const key = $(entry).find('PRIMARYKEY')
                track.index = index
                track.key = key.attr('KEY')
                track.collectionEntry = collection[track.key]

                const extendedData = $(entry).find('EXTENDEDDATA')
                if (extendedData.length) {
                    track.playedPublic = !!parseInt(extendedData.attr('PLAYEDPUBLIC'))
                    track.startTime = parseInt(extendedData.attr('STARTTIME'))
                    track.startTime = NMLTimeToTime(track.startTime)
                    track.startDate = parseInt(extendedData.attr('STARTDATE'))
                    track.startDate = NMLDateToDate(track.startDate)
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
            .toArray()
        
        computeTrackOffsets(playList)
        return playList
    })
    return playlists.toArray()
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
    const hasHours = NMLTimeToTime((lastTime - start) / 1000).hours > 0
    
    playList.tracks.forEach((track) => {
        track.timeOffset = (track.startTimeJS - start) / 1000
        track.timeOffsetString = timeString(track.timeOffset, !hasHours)
    })
}


/**
 * Given the contents of an NML file, converts all playlists within to a 
 * human readable form.
 * 
 * @param {string} nmlText  NML file contents.
 * @returns null if NML file is invalid
 */
function nmlToPlaylists(nmlText) {
    // Step 1 - Parse NML File
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(nmlText, "text/xml");
    const parseerror = $(xmlDoc).find("parsererror");

    if (parseerror.length !== 0) {
        return null
    }

    // Step 2 - Build Track Database
    const collection = nmlCollection(xmlDoc)
    
    // Step 3 - Walk all Playlists in the NML and make Human Readable
    let result = []
    const playlists = nmlPlaylists(xmlDoc, collection)
    const FORMAT_STRING = getFormatString()

    playlists.forEach((playList) => {
        if (result.length) { result.push('\n')}
        result.push(playList.name)

        playList.tracks.map((track) => result.push(format(playList, track, FORMAT_STRING)))
    })

    return result.join('\n')
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

const TRACK_FIELDS = {
    INDEX: (playList, track, formatString) => formatString.replace('${INDEX}', track.index + 1),
    INDEX_PADDED: (playList, track, formatString) => {
        const padding = playList.tracks.length.toString().length
        return formatString.replace('${INDEX_PADDED}', (track.index + 1).toString().padStart(padding, '0'))
    },
    TITLE: (playList, track, formatString) => formatString.replace('${TITLE}', track.collectionEntry.title || 'Unknown Title'),
    ARTIST: (playList, track, formatString) => formatString.replace('${ARTIST}', track.collectionEntry.artist || 'Unknown Artist'),
    OFFSET: (playList, track, formatString) => {
        const substitution = track?.timeOffsetString ?? ''
        return formatString.replace('${OFFSET}', substitution)
    }
}

function format(playList, track, formatString) {
    Object.keys(TRACK_FIELDS).forEach((trackKey) => {
        formatString = TRACK_FIELDS[trackKey](playList, track, formatString)
    })
    return formatString
}

function getFormatString() {
    let formatString = document.getElementById('formatString').value
    if (formatString.length === 0) {
        formatString = '${INDEX}. ${TITLE} - ${ARTIST}'
    }
    return formatString
}

function convert() {
    const nmlText = document.getElementById('nml').value
    let humanReadableText = nmlToPlaylists(nmlText)

    if (humanReadableText === null) {
        humanReadableText = 'Bad NML File or No Playlist(s) found.'
    }

    setTrackList(humanReadableText)
}

function setTrackList(trackList) {
    document.getElementById('trackList').textContent = trackList
}

function upload(e) {
    const file = e.target.files[0]
    if (!file) {return}
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onload = function () {
        $('#nml').val(reader.result.toString())
        convert()
    }
    e.target.value = ''
}

/** 
 * Doesn't work - haven't debugged.
 */
function copyToClipboard() {
    const copyText = document.getElementById('trackList')
    copyText.select()
    copyText.setSelectionRange(0, 99999) /* For mobile devices */
    navigator.permissions.query({ name: "clipboard-write" }).then(result => {
        if (result.state == "granted" || result.state == "prompt") {
            navigator.clipboard.writeText(copyText.value)
            console.log(copyText.value)
            alert("Track list copied to Clipbaord")
        } else {
            alert('Sorry, no clipboard access.')
        }
    });
}