export function parseRekordBox(xmlDoc, startTrackIndex, onlyPlayedTracks) {
    const rekordBoxRoot = $(xmlDoc).find("DJ_PLAYLISTS")
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
    return $(xmlDoc)
        .find("DJ_PLAYLISTS COLLECTION TRACK")
        .map((index, entry) => {
            return { 
                key: entry.getAttribute('TrackID'), 
                title: entry.getAttribute('Name'), 
                artist: entry.getAttribute('Artist')
            }
        })
        .toArray()
        .reduce((collection, track) => {collection[track.key] = track; return collection}, {})
}

function parsePlaylists(xmlDoc, collection, startTrackIndex, onlyPlayedTracks) {
    const playlistNodes = $(xmlDoc).find("DJ_PLAYLISTS PLAYLISTS NODE[KeyType=0]")

    var playlists = playlistNodes.map((_,playlistNode) => {
        const playList = {
            name: playlistNode.getAttribute('Name'),
            tracks: []
        }
        playList.tracks = $('TRACK', playlistNode)
            .map((index, entry) => {
                const track = {
                    key: $(entry).attr('Key'),
                    playedPublic: true
                }
                track.collectionEntry = collection[track.key]
                return track
            })
            .filter((index, _) => index >= (startTrackIndex - 1))
            .filter((_, track) => onlyPlayedTracks ? track.playedPublic : true)
            .toArray()
        
        // computeTrackOffsets(playList)
        return playList
    })
    return playlists.toArray()
}