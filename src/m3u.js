export function parseM3U(contents, startTrackIndex, onlyPlayedTracks) {
    if (!contents.startsWith('#EXTM3U')) {
        return null
    }
    const archive = {
        collection: {},
        playlists: [{
            name: 'Untitled Playlist',
            tracks: []
        }],
        format: 'M3U'
    }

    const lines = contents.split('\n')
    
    lines.forEach((line) => {
        const regex = /^#EXTINF:(\d+),(([^-]*$)|(.*)( - )(.*))/g
        const match = regex.exec(line)
        if (match) {
            archive.collection[match[1]] = {
                key: match[1],
                title: match[6] || match[3],
                artist: match[4] || ''
            }
            archive.playlists[0].tracks.push({
                key: match[1],
                playedPublic: true,
                collectionEntry: archive.collection[match[1]]
            })
        }
    })
    return archive
}
