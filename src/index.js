import { TraktorParser } from './traktor'
import { RekordBoxParser } from './rekordbox'
import { M3UParser } from './m3u'
import { CUEParser } from './cue'
import {RekordBoxTXTParser} from './rekordboxtxt'

const DEFAULT_FORMAT_STRING = '${INDEX}. ${TITLE} - ${ARTIST}'
const PARSERS = [TraktorParser, RekordBoxParser, M3UParser, CUEParser, RekordBoxTXTParser]

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
        formatString = DEFAULT_FORMAT_STRING
    }
    return formatString
}

/**
 * Given an archive, converts all playlists within to a human readable form.
 * 
 * @param {string} fileContents  Archive file contents.
 * @param {number} startTrackIndex Offset at which to start displaing tracks.
 * @param {boolean} onlyPlayedTracks (Traktor Only) Only return tracks that 
 *                                   were played live.
 * @returns null if Archive file is invalid
 */
 function archiveToPlaylists(fileContents, startTrackIndex, onlyPlayedTracks) {
    // Step 1 - Find all parsers that support this file type.
    const supportedParsers = PARSERS.map((parserClass) => {
        const parser = new parserClass()
        if (parser.supports(fileContents)) {
            return parser
        }
    }).filter((v) => v)
    if (!supportedParsers.length) { return null }

    // Step 2 - Convert to Canonical JSON
    // TODO startTrack and onlyLive should be per playlist, not globa.
    const archive = supportedParsers[0].parse(fileContents, startTrackIndex, onlyPlayedTracks)
    if (!archive) { 
        return null
    }
    
    // Step 3 - Walk all Playlists in the archive and make Human Readable
    let result = []
    const FORMAT_STRING = getFormatString()

    archive.playlists.forEach((playList) => {
        if (result.length) {
            result.push('\n')
        }
        result.push(playList.name)

        playList.tracks
            .map((track, index) => result.push(format(playList, index, FORMAT_STRING)))
    })

    return result.join('\n')
}

function convertToReadable() {
    const fileContents = document.getElementById('archive').value
    const startTrackIndex = Math.max(1, document.getElementById('startTrackIndex').value)
    const onlyPlayPublicTracks = document.getElementById('publicTracks').checked
    let humanReadableText = archiveToPlaylists(fileContents, startTrackIndex, onlyPlayPublicTracks)

    if (humanReadableText === null) {
        humanReadableText = 'Bad File or No Playlist(s) found.'
    }

    document.getElementById('trackList').textContent = humanReadableText
}

function uploadTracklist(e) {
    const file = e.target.files[0]
    if (!file) {
        return
    }
    const reader = new FileReader()

    reader.readAsText(file)
    reader.onload = function () {
        const archive = document.getElementById('archive')
        archive.value = reader.result.toString()
        convertToReadable()
    }
    // If you upload the same file twice the second upload won't trigger
    // this function.  Clearing the value fixes this.
    e.target.value = ''
}

function copyToClipboard() {
    const copyText = document.getElementById('trackList').innerText
    navigator.clipboard.writeText(copyText)
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('archiveFile').addEventListener("change", uploadTracklist, false)
    document.getElementById('formatString').addEventListener("input", convertToReadable, false)
    document.getElementById('startTrackIndex').addEventListener("input", convertToReadable, false)
    document.getElementById('publicTracks').addEventListener("input", convertToReadable, false)
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
