import { TraktorParser } from './traktor'
import { RekordBoxParser } from './rekordbox'
import { M3UParser } from './m3u'

const PARSERS = [TraktorParser, RekordBoxParser, M3UParser]

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
    // Step 1 - Convert to Canonical JSON
    const supportedParsers = PARSERS.map((parserClass) => {
        const parser = new parserClass()
        if (parser.supports(xmlText)) {
            return parser
        }
    }).filter((v) => v)
    if (!supportedParsers.length) { return null }
    const archive = supportedParsers[0].parse(xmlText, startTrackIndex, onlyPlayedTracks)
    if (!archive) { return null }
    
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
        const archive = document.getElementById('archive')
        archive.value = reader.result.toString()
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
    const copyText = document.getElementById('trackList').innerText
    navigator.clipboard.writeText(copyText)
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('archiveFile').addEventListener("change", upload, false)
    document.getElementById('formatString').addEventListener("input", convert, false)
    document.getElementById('startTrackIndex').addEventListener("input", convert, false)
    document.getElementById('publicTracks').addEventListener("input", convert, false)
    document.getElementById('copyToClipboard').addEventListener("click", copyToClipboard, false)
    
    const fieldList = Object.keys(TRACK_FIELDS)
        .map((fieldName) => `\${${fieldName}}`)
        .join(' ')
    document.getElementById('fieldList').textContent =
        document.getElementById('fieldList').textContent + fieldList

    const extensions = PARSERS.map((parser) => parser.extensions ).flat()
    const uploadInput = document.getElementById('archiveFile')
    uploadInput.accept = extensions.join(',')
});
