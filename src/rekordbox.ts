import { Archive, ArchiveTrack, Collection, CPlaylist, Parser, PlaylistTrack } from "./archive"
import { querySelectorAllParents } from "./common"

export class RekordBoxParser implements Parser {
    static format = "RekordBox"
    static extensions = ['.xml']

    parseXML(contents:string) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(contents, "text/xml")
        const parseError = xmlDoc.getElementsByTagName("parsererror")

        if (parseError.length !== 0) {
            return null
        }
        return xmlDoc
    }

    supports(contents:string):boolean {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return false
        }
        const rekordBoxRoot = xmlDoc.getElementsByTagName("DJ_PLAYLISTS")
        return rekordBoxRoot.length > 0
    }
    
    parse(contents:string):Archive|null {
        const xmlDoc = this.parseXML(contents)

        if (!xmlDoc) {
            return null
        }

        return parseRekordBox(xmlDoc)
    }  
}

function parseRekordBox(xmlDoc:XMLDocument) {
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

function parseCollection(xmlDoc:XMLDocument) {
    // Selector we are simulating 'DJ_PLAYLISTS > COLLECTION > TRACK'
    const tracks = querySelectorAllParents(xmlDoc, ['DJ_PLAYLISTS', 'COLLECTION', 'TRACK'])
    
    const collection = Array.prototype.map.call(tracks,
        (entry:Element, index:number) => {
            return { 
                key: entry.attributes.getNamedItem('TrackID')?.value, 
                title: entry.attributes.getNamedItem('Name')?.value, 
                artist: entry.attributes.getNamedItem('Artist')?.value
            }
        })
        .reduce((collection:Collection, track:ArchiveTrack) => {
            collection[track.key] = track; return collection
        }, {})
    
        return collection
}

function parsePlaylists(xmlDoc: XMLDocument, collection: Collection) {
    const playlistNodes = xmlDoc.querySelectorAll("NODE[Type='1']")

    return Array.prototype.map.call(playlistNodes, (playlistNode:Element) => {
        const name = playlistNode.attributes.getNamedItem('Name')?.value || ''
        const playList = new CPlaylist(name, [])

        playList.tracks = Array.prototype.map.call(playlistNode.getElementsByTagName('TRACK'),
            (entry: Element, index: number) => {
                const key = entry.attributes.getNamedItem('Key')?.value ?? ''
                const track:PlaylistTrack = {
                    key: key,
                    playedPublic: true,
                    collectionEntry: collection[key] as ArchiveTrack
                }
                return track
            })
        
        return playList
    })
}