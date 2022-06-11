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
 * with shape {name:'Playlist Name', tracks: [KEY1, ...KEYN]}.  The order of the `tracks` 
 * array is the order in which the tracks were played/sorted.
 * 
 * @param {XMLDocument} xmlDoc
 * @returns Array of playlists.
 */
function nmlPlaylists(xmlDoc) {
    const playlistNodes = $(xmlDoc).find("NODE[TYPE=PLAYLIST]")

    var x = playlistNodes.map((_,v) => {
        const playList = {
            name: v.getAttribute('NAME'),
            tracks: []
        }
        playList.tracks = $('PLAYLIST ENTRY', v)
            .map((_, entry) => {
                const key = $(entry).find('PRIMARYKEY')
                return key.attr('KEY')
            })
            .toArray()
        return playList
    })
    return x.toArray()
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
    
    // Step 3 - Walk all Playlists in the NML and make it Readable
    let result = []
    const playlists = nmlPlaylists(xmlDoc)
    const FORMAT_STRING = getFormatString()

    playlists.forEach((playList) => {
        if (result.length) { result.push('\n')}
        result.push(playList.name)

        const trackList = playList.tracks.map((key) => collection[key])
        trackList.map((_, index) => result.push(format(trackList, index, FORMAT_STRING)))
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

function timeString(t) {
    const HH = hours(t).toString().padStart(2, '0')
    const MM = minutes(t).toString().padStart(2, '0')
    const SS = seconds(t).toString().padStart(2, '0')
    return `${HH}:${MM}:${SS}`
}

const TRACK_FIELDS = {
    INDEX: (trackList, index, formatString) => formatString.replace('${INDEX}', index + 1),
    INDEX_PADDED: (trackList, index, formatString) => {
        const padding = trackList.length.toString().length
        return formatString.replace('${INDEX_PADDED}', (index + 1).toString().padStart(padding, '0'))
    },
    TITLE: (trackList, index, formatString) => formatString.replace('${TITLE}', trackList[index].title || 'Unknown Title'),
    ARTIST: (trackList, index, formatString) => formatString.replace('${ARTIST}', trackList[index].artist || 'Unknown Artist'),
}

function format(trackList, index, formatString) {
    Object.keys(TRACK_FIELDS).forEach((key) => {
        formatString = TRACK_FIELDS[key](trackList, index, formatString)
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