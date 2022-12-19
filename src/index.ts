import { TraktorParser } from './parsers/traktor'
import { RekordBoxParser } from './parsers/rekordbox'
import { M3U8Parser } from './parsers/m3u8'
import { CUEParser } from './parsers/cue'
import {RekordBoxTXTParser} from './parsers/rekordboxtxt'
import {DEFAULT_FORMAT_STRING, playlistToReadable, TRACK_FIELDS} from './formatter'
import { Playlist } from './parsers/archive'

/**
 * HACK - TypeScript errors out on every possible null value from
 * getElementbyId so we use this to ignore it and let the app crash at runtime.
 */
 function getElementById<T = HTMLElement>(id: string): T {
    return document.getElementById(id) as T
}

const PARSERS = [TraktorParser, RekordBoxParser, M3U8Parser, CUEParser, RekordBoxTXTParser]

function getFormatString() {
    const formatStringInput = getElementById<HTMLInputElement>('formatString')
    let formatString = formatStringInput.value
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
 * @return Archive if parsed, otherwise null.
 */
 function parseArchive(fileContents: string) {
    for (let parserClass of PARSERS) {
        const parser = new parserClass(fileContents)
        if (parser.supports()) {
            return parser.parse()
        }
    }

    return null
}

function convertToReadable(fileContents: string) {
    hideErrorResult()
    hidePlaylistResults()

    const archive = parseArchive(fileContents)

    if (!archive) {
        showErrorResult('Sorry, we could not parse that file.')
        const trackListElements = getElementById('trackList')
        trackListElements.innerText = "No playlists found."
        return
    }
    
    const dropDown = getElementById<HTMLSelectElement>('playlistsDropDown')
    dropDown.replaceChildren('')
    archive.playlists.forEach((playlist, index) => {
        const option = document.createElement('option')
        if (playlist.name.trim().length) {
            option.innerText = playlist.name
        } else {
            option.innerText = `Playlist ${index + 1}`
        }
        (option as any).playlist = playlist
        dropDown.appendChild(option)
    })
    
    showPlaylistResults()
    updateSelectedPlaylist()
}

function hidePlaylistResults() {
    const div = getElementById('playlistResults')
    div.setAttribute('class', 'hidden')
}

function showPlaylistResults() {
    const div = getElementById('playlistResults')
    div.setAttribute('class', '')
}

function hideErrorResult() {
    const div = getElementById('errorResults')
    div.setAttribute('class', 'hidden')
}
function showErrorResult(errorMessage: string) {
    const div = getElementById('errorResults')
    div.setAttribute('class', '')
    const errorMessageElement = getElementById('errorMessage')
    errorMessageElement.innerText = errorMessage
}

function updateSelectedPlaylist() {
    const dropDown = getElementById<HTMLSelectElement>('playlistsDropDown')
    const selectedOption = dropDown.selectedOptions[0]
    let startTrackIndex: number = parseInt(getElementById<HTMLInputElement>('startTrackIndex').value) || 1
    startTrackIndex = Math.max(0, startTrackIndex - 1)
    const onlyPlayedTracks = getElementById<HTMLInputElement>('publicTracks')
    const playlist: Playlist = (selectedOption as any).playlist as Playlist
    const filteredPlaylist = playlist.filter(startTrackIndex, onlyPlayedTracks.checked)
    getElementById('trackList').textContent = playlistToReadable(filteredPlaylist, getFormatString())
}

function uploadTracklist(e: Event) {XMLHttpRequestEventTarget
    const fileElement = e.target as HTMLInputElement
    const file = fileElement?.files?.[0]
    if (!file) {
        return
    }
    const reader = new FileReader()

    reader.readAsText(file)
    reader.onload = function () {
        const newArchiveText: string = reader?.result?.toString() ?? ''
        convertToReadable(newArchiveText)
    }
    // If you upload the same file twice the second upload won't trigger
    // this function.  Clearing the value fixes this.
    fileElement.value = ''
}

function copyToClipboard() {
    const trackListElement = getElementById('trackList')
    const copyText = trackListElement.innerText
    navigator.clipboard.writeText(copyText)
}

function saveToTxtFile() {
    const trackListElement = getElementById('trackList')
    const copyText = trackListElement.innerText
    const blob = new Blob([copyText], {type: "text/plain;charset=utf-8"});
    let playlistName = '' as string
    const dropDown = getElementById<HTMLSelectElement>('playlistsDropDown')
    const selectedOption = dropDown.selectedOptions[0]
    if (selectedOption) {
        playlistName = selectedOption.innerText + '.txt'
    } else {
        playlistName = 'playlist.txt'
    }
    saveAs(blob, playlistName);
}

function saveAs(blob: Blob, fileName: string) {
    const link = document.createElement("a");
    link.download = fileName
    link.href = URL.createObjectURL(blob);
    link.click();
}

window.addEventListener('DOMContentLoaded', () => {
    getElementById('archiveFile').addEventListener("change", uploadTracklist, false)
    getElementById('formatString').addEventListener("input", updateSelectedPlaylist, false)
    getElementById('startTrackIndex').addEventListener("input", updateSelectedPlaylist, false)
    getElementById('publicTracks').addEventListener("input", updateSelectedPlaylist, false)
    getElementById('copyToClipboard').addEventListener("click", copyToClipboard, false)
    getElementById('saveToTxtFile').addEventListener("click", saveToTxtFile, false)
    getElementById('playlistsDropDown').addEventListener('change', updateSelectedPlaylist, false)
    
    const fieldList = Object.keys(TRACK_FIELDS)
        .map((fieldName) => `\${${fieldName}}`)
        .join(' ')
    const fieldListElement = getElementById('fieldList') 
        fieldListElement.textContent =
        fieldListElement.textContent + fieldList

    const extensions = PARSERS.map((parser) => parser.extensions ).flat()
    const uploadInput = getElementById<HTMLInputElement>('archiveFile')
    uploadInput.accept = extensions.join(',')
});


