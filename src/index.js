import { TraktorParser } from './traktor'
import { RekordBoxParser } from './rekordbox'
import { M3U8Parser } from './m3u8'
import { CUEParser } from './cue'
import {RekordBoxTXTParser} from './rekordboxtxt'
import {DEFAULT_FORMAT_STRING, playlistToReadable, TRACK_FIELDS} from './formatter'

const PARSERS = [TraktorParser, RekordBoxParser, M3U8Parser, CUEParser, RekordBoxTXTParser]

function getFormatString() {
    let formatString = document.getElementById('formatString').value
    if (formatString.length === 0) {
        formatString = DEFAULT_FORMAT_STRING
    }
    return formatString
}

/**
 * Parses the uploaded file contents with the first matching parser, returning
 * the archive in canonical JSON format.
 * 
 * @param {string} fileContents  Archive file contents.
 * @param {number} startTrackIndex Offset at which to start displaing tracks.
 * @param {boolean} onlyPlayedTracks (Traktor Only) Only return tracks that 
 *                                   were played live.
 * @return Archive if parsed, otherwise null.
 */
 function parserArchive(fileContents, startTrackIndex, onlyPlayedTracks) {
    const supportedParsers = PARSERS.map((parserClass) => {
        const parser = new parserClass()
        if (parser.supports(fileContents)) {
            return parser
        }
    }).filter((v) => v)

    if (!supportedParsers.length) {
        return null
    }

    return supportedParsers[0].parse(fileContents, startTrackIndex, onlyPlayedTracks)
}

function convertToReadable() {
    const fileContents = document.getElementById('archive').value
    const archive = parserArchive(fileContents)

    hideErrorResult()
    hidePlaylistResults()

    if (!archive) {
        showErrorResult('Sorry, we could not parse that file.')
        document.getElementById('trackList').innerText = "No playlists found."
        return
    }
    
    // playlistsDropDown
    const dropDown = document.getElementById('playlistsDropDown')
    dropDown.replaceChildren('')
    archive.playlists.forEach((playlist, index) => {
        const option = document.createElement('option')
        if (playlist.name.trim().length) {
            option.innerText = playlist.name
        } else {
            option.innerText = `Playlist ${index + 1}`
        }
        option.playlist = playlist
        dropDown.appendChild(option)
    })
    showPlaylistResults()
    updateSelectedPlaylist()
}

function hidePlaylistResults() {
    const div = document.getElementById('playlistResults')
    div.setAttribute('class', 'hidden')
}

function showPlaylistResults() {
    const div = document.getElementById('playlistResults')
    div.setAttribute('class', '')
}

function hideErrorResult() {
    const div = document.getElementById('errorResults')
    div.setAttribute('class', 'hidden')
}
function showErrorResult(errorMessage) {
    const div = document.getElementById('errorResults')
    div.setAttribute('class', '')
    const errorMessageElement = document.getElementById('errorMessage')
    errorMessageElement.innerText = errorMessage
}

function updateSelectedPlaylist() {
    const dropDown = document.getElementById('playlistsDropDown')
    const selectedOption = dropDown.selectedOptions[0]
    const startTrackIndex = Math.max(1, document.getElementById('startTrackIndex').value) - 1
    const onlyPlayedTracks = document.getElementById('publicTracks').checked
    const playlist = selectedOption.playlist
    const filteredPlaylist = playlist.filter(startTrackIndex, onlyPlayedTracks)
    document.getElementById('trackList').textContent = playlistToReadable(filteredPlaylist, getFormatString())
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
    document.getElementById('formatString').addEventListener("input", updateSelectedPlaylist, false)
    document.getElementById('startTrackIndex').addEventListener("input", updateSelectedPlaylist, false)
    document.getElementById('publicTracks').addEventListener("input", updateSelectedPlaylist, false)
    document.getElementById('copyToClipboard').addEventListener("click", copyToClipboard, false)
    document.getElementById('playlistsDropDown').addEventListener('change', updateSelectedPlaylist, false)
    
    const fieldList = Object.keys(TRACK_FIELDS)
        .map((fieldName) => `\${${fieldName}}`)
        .join(' ')
    document.getElementById('fieldList').textContent =
        document.getElementById('fieldList').textContent + fieldList

    const extensions = PARSERS.map((parser) => parser.extensions ).flat()
    const uploadInput = document.getElementById('archiveFile')
    uploadInput.accept = extensions.join(',')
});
