import { expect } from 'chai'
import { cueParser } from '../../src/cue'
import { Archive, Playlist, PlaylistTrack } from '../../src/archive'
import { DEFAULT_FORMAT_STRING, format } from '../../src/formatter'

describe('Track formatting', () => {
    const CUE_DATA = `
        REM DATE 2022-10-29
        REM RECORDED_BY "rekordbox-dj"
        TITLE "Music and Love"
        PERFORMER "The Acidic Rabbi"
        FILE "01 Music and Love.wav" WAVE
            TRACK 01 AUDIO
                TITLE "Channel"
                PERFORMER "Nile Delta, Knightlife, Chicken Lips, Tornado Wallace"
                FILE "/Users/benlazar/Downloads/TunesKitMusicConverter/Channel.mp3" WAVE
                INDEX 01 00:00:00        
            TRACK 02 AUDIO
                TITLE "Westcoast Boogie"
                PERFORMER "Bronx Cheer"
                FILE "/Users/benlazar/Downloads/TunesKitMusicConverter/Westcoast Boogie(1).mp3" WAVE
                INDEX 01 00:03:48
                    `
    function buildArchive(trackCount:number): Archive {
        const archive:Archive = cueParser(CUE_DATA)
        const playList = archive.playlists[0] as Playlist
        const lastTrack = playList.tracks[playList.tracks.length - 1] as PlaylistTrack

        while (playList.tracks.length < trackCount) {
            playList.tracks.push(lastTrack)
        }
        return archive
    }

    it('has a default format string', () => {
        const archive:Archive = cueParser(CUE_DATA)
        const playList = archive.playlists[0] as Playlist
        const formattedTrack = format(playList, 0, DEFAULT_FORMAT_STRING)
        expect(formattedTrack).to.equal('1. Channel - Nile Delta, Knightlife, Chicken Lips, Tornado Wallace')
    })

    describe('index', () => {
        it('can be zero padded', () => {
            const archive:Archive = buildArchive(10)
            const playList = archive.playlists[0] as Playlist
            const formattedTrack = format(playList, 0, '${INDEX_PADDED}')
            expect(formattedTrack).to.equal('01')
        })
        it('can be unpadd', () => {
            const archive:Archive = buildArchive(10)
            const playList = archive.playlists[0] as Playlist
            const formattedTrack = format(playList, 0, '${INDEX}')
            expect(formattedTrack).to.equal('1')
        })
    })
})
