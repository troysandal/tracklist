import { expect } from 'chai'
import { cueParser } from '../../src/cue'
import { Archive, Playlist } from '../../src/archive'
import { DEFAULT_FORMAT_STRING, format } from '../../src/formatter'

describe('Track formatting', () => {
    it('is very basic', () => {
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
        const archive:Archive = cueParser(CUE_DATA)
        expect(archive.format).to.equal('CUE')
        expect(Object.keys(archive.collection).length).to.equal(2)
        expect(archive.playlists.length).to.equal(1)
        const playList = archive.playlists[0] as Playlist
        const formattedTrack = format(playList, 0, DEFAULT_FORMAT_STRING)
        expect(formattedTrack).to.equal('1. Channel - Nile Delta, Knightlife, Chicken Lips, Tornado Wallace')
    })
})
