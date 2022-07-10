import { parseTraktor } from './traktor.js'

const TRACK_FIELDS = {
    INDEX: (playList, trackIndex, formatString) => formatString.replace('${INDEX}', trackIndex + 1),
    INDEX_PADDED: (playList, trackIndex, formatString) => {
        const padding = playList.tracks.length.toString().length
        return formatString.replace('${INDEX_PADDED}', (trackIndex + 1).toString().padStart(padding, '0'))
    },
    TITLE: (playList, trackIndex, formatString) => formatString.replace('${TITLE}', playList.tracks[trackIndex].collectionEntry.title || 'Unknown Title'),
    ARTIST: (playList, trackIndex, formatString) => formatString.replace('${ARTIST}', playList.tracks[trackIndex].collectionEntry.artist || 'Unknown Artist'),
    OFFSET: (playList, trackIndex, formatString) => {
        const substitution = playList.tracks[trackIndex]?.timeOffsetString ?? ''
        return formatString.replace('${OFFSET}', substitution)
    }
}

function format(playList, trackIndex, formatString) {
    Object.keys(TRACK_FIELDS).forEach((trackKey) => {
        formatString = TRACK_FIELDS[trackKey](playList, trackIndex, formatString)
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

/**
 * Given an archive, converts all playlists within to a human readable form.
 * 
 * @param {string} xmlText  Archive file contents.
 * @returns null if Archive file is invalid
 */
 function archiveToPlaylists(xmlText, startTrackIndex, onlyPlayedTracks) {
    // Step 1 - Parse Archive File
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const parseError = $(xmlDoc).find("parsererror");

    if (parseError.length !== 0) {
        return null
    }

    // Step 2 - Convert to Canonical JSON
    const archive = parseTraktor(xmlDoc, startTrackIndex, onlyPlayedTracks)
    
    // Step 3 - Walk all Playlists in the archive and make Human Readable
    let result = []
    const FORMAT_STRING = getFormatString()

    archive.playlists.forEach((playList) => {
        if (result.length) { result.push('\n')}
        result.push(playList.name)

        playList.tracks
            .map((track, index) => result.push(format(playList, index, FORMAT_STRING)))
    })

    return result.join('\n')
}

function convert() {
    const xmlText = document.getElementById('archive').value
    const startTrackIndex = Math.max(1, document.getElementById('startTrackIndex').value)
    const onlyPlayPublicTracks = document.getElementById('publicTracks').checked
    let humanReadableText = archiveToPlaylists(xmlText, startTrackIndex, onlyPlayPublicTracks)

    if (humanReadableText === null) {
        humanReadableText = 'Bad File or No Playlist(s) found.'
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
        $('#archive').val(reader.result.toString())
        convert()
    }
    // If you upload the same file twice the second upload won't trigger
    // this function.  Clearing the value fixes this.
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


function showArchiveContents() {
    $('#archive').show()
    $('#showArchive').hide()
}

$(() => {
    document.getElementById('archiveFile').addEventListener("change", upload, false)
    document.getElementById('formatString').addEventListener("input", convert, false)
    document.getElementById('archive').addEventListener("input", convert, false)
    document.getElementById('startTrackIndex').addEventListener("input", convert, false)
    document.getElementById('publicTracks').addEventListener("input", convert, false)
    document.getElementById('showArchive').addEventListener("click", showArchiveContents, false)
    
    const fieldList = Object.keys(TRACK_FIELDS)
        .map((fieldName) => `\${${fieldName}}`)
        .join(' ')
    document.getElementById('fieldList').textContent =
        document.getElementById('fieldList').textContent + fieldList
})

