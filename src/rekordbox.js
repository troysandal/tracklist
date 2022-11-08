import { CPlaylist } from "./archive"

export class RekordBoxParser {
    static format = "RekordBox"
    static extensions = ['.xml']

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
        const rekordBoxRoot = xmlDoc.getElementsByTagName("DJ_PLAYLISTS")
        return rekordBoxRoot.length > 0
    }
    
    parse(contents) {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return null
        }

        return parseRekordBox(xmlDoc)
    }  
}

function parseRekordBox(xmlDoc) {
    const rekordBoxRoot = xmlDoc.getElementsByTagName("DJ_PLAYLISTS")
    if (!rekordBoxRoot.length) {
        return null
    }

    const archive = {
        collection: parseCollection(xmlDoc),
        playlists: [],
        format: 'RekordBox'
    }
    archive.playlists = parsePlaylists(xmlDoc, archive.collection)
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

function parsePlaylists(xmlDoc, collection) {
    const playlistNodes = xmlDoc.querySelectorAll("DJ_PLAYLISTS > PLAYLISTS NODE[KeyType='0']")

    var playlists = Array.prototype.map.call(playlistNodes, (playlistNode) => {
        const playList = new CPlaylist(playlistNode.attributes['Name'].value, [])
        playList.tracks = Array.prototype.map.call(playlistNode.getElementsByTagName('TRACK'),
            (entry, index) => {
                const track = {
                    key: entry.attributes['Key'].value,
                    playedPublic: true
                }
                track.collectionEntry = collection[track.key]
                return track
            })
        
        return playList
    })
    return playlists
}