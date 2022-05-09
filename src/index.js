function nmlToTracks(xmlDoc) {
    xmlDoc = $(xmlDoc)
    
    // Step 1 - Build Track Database
    const trackList = xmlDoc
        .find("COLLECTION ENTRY")
        .map((index, entry) => {
            const track = { 
                title: entry.getAttribute('TITLE'), 
                artist: entry.getAttribute('ARTIST')
            }
            const location = $(entry).find('LOCATION')
            track.key = location.attr('VOLUMEID') + location.attr('DIR') + location.attr('FILE')
            return track
        })
        .toArray()
        .reduce((prev, curr) => {prev[curr.key] = curr; return prev}, {})
    
    // Step 2 - Get Playlist with Sorted Track Order
    const playList = xmlDoc
        .find('PLAYLISTS PLAYLIST ENTRY')
        .map((_, entry) => {
            const key = $(entry).find('PRIMARYKEY')
            return key.attr('KEY')
        })
        .toArray()

    // Step 3 - return tracks in order played
    return playList.map((entry) => trackList[entry])
}

function formatTrackList(trackList, formatString) {
    return trackList
        .map((track, index) => format(trackList, index, formatString))
        .join('\n')
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

function convert() {
    const nml = document.getElementById('nml').value

    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(nml, "text/xml");
    var parseerror = $(xmlDoc).find("parsererror");

    if (parseerror.length !== 0) {
        setTrackList('Bad NML File')
        return
    }

    const tracks = nmlToTracks(xmlDoc)
    let formatString = document.getElementById('formatString').value
    if (formatString.length === 0) {
        formatString = '${INDEX}. ${TITLE} - ${ARTIST}'
    }

    setTrackList(formatTrackList(tracks, formatString))
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