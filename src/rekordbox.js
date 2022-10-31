export class RekordBoxParser {
    format = "RekordBox"
    extensions = ['.xml']

    supports(contents) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(contents, "text/xml")
        const parseError = xmlDoc.getElementsByTagName("parsererror")

        if (parseError.length !== 0) {
            return false
        }
        const rekordBoxRoot = xmlDoc.getElementsByTagName("DJ_PLAYLISTS")
        return rekordBoxRoot.length > 0
    }
    
    parse(contents, startTrackIndex, onlyPlayedTracks) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(contents, "text/xml")
        const parseError = xmlDoc.getElementsByTagName("parsererror")

        if (parseError.length !== 0) {
            return null
        }

        return parseRekordBox(contents, startTrackIndex, onlyPlayedTracks)
    }  
}

export function parseRekordBox(xmlDoc, startTrackIndex, onlyPlayedTracks) {
    const rekordBoxRoot = xmlDoc.getElementsByTagName("DJ_PLAYLISTS")
    if (!rekordBoxRoot.length) {
        return null
    }

    const archive = {
        collection: parseCollection(xmlDoc),
        playlists: [],
        format: 'RekordBox'
    }
    archive.playlists = parsePlaylists(xmlDoc, archive.collection, startTrackIndex, onlyPlayedTracks)
    return archive
}

function parseCollection(xmlDoc) {
    const tracks = xmlDoc
        .getElementsByTagName('DJ_PLAYLISTS')[0]
        .getElementsByTagName("COLLECTION")[0]
        .getElementsByTagName("TRACK")
    
    const collection = Array.prototype.map.call(tracks,
        (entry, index) => {
            return { 
                key: entry.attributes['TrackID'].value, 
                title: entry.attributes['Name'].value, 
                artist: entry.attributes['Artist'].value
            }
        })
        .reduce((collection, track) => {collection[track.key] = track; return collection}, {})
    
        return collection
}

function parsePlaylists(xmlDoc, collection, startTrackIndex, onlyPlayedTracks) {
    const playlistNodes = xmlDoc.querySelectorAll("DJ_PLAYLISTS > PLAYLISTS NODE[KeyType='0']")

    var playlists = Array.prototype.map.call(playlistNodes, (playlistNode) => {
        const playList = {
            name: playlistNode.attributes['Name'].value,
            tracks: []
        }
        playList.tracks = Array.prototype.map.call(playlistNode.getElementsByTagName('TRACK'),
            (entry, index) => {
                const track = {
                    key: entry.attributes['Key'].value,
                    playedPublic: true
                }
                track.collectionEntry = collection[track.key]
                return track
            })
            .filter((_, index) => index >= (startTrackIndex - 1))
            .filter((track) => onlyPlayedTracks ? track.playedPublic : true)
        
        // computeTrackOffsets(playList)
        return playList
    })
    return playlists
}