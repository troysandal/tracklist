import { expect } from 'chai'
import * as fs from 'fs';
import { Archive, ArchiveTrack, Playlist } from '../../src/archive';
import {M3UParser} from '../../src/m3u'

describe('M3U Parser', () => {
    it('handles empty playlists', () => {
        const TEST = `#EXTM3U`
        const parser = new M3UParser()
        expect(parser.supports(TEST)).to.be.true
        const archive = parser.parse(TEST, 1, true) as Archive

        expect(archive).to.not.be.null
        expect(Object.keys(archive.collection).length).to.equal(0)
        
        const playlist = archive.playlists[0] as Playlist
        expect(playlist.tracks.length).to.equal(0)
    })

    it('handles duplicate EXTINF keys', () => {
        const TEST = `#EXTM3U
        #EXTINF:293,Block & Crown - Boogie Renegade (Original Mix)
        /Users/troy/Music/iTunes/iTunes Media/Music/Block & Crown/Boogie Renegade/16599425_Boogie Renegade_(Original Mix)_PN.mp3
        #EXTINF:293,Da Funk Junkies, Rubber People - Holdin On (Original Mix)
        /Users/troy/Music/iTunes/iTunes Media/Music/Da Funk Junkies, Rubber People/The Best of Rubber People, Vol. 1/16266992_Holdin On_(Original Mix)_PN.mp3
        `
        const parser = new M3UParser()
        expect(parser.supports(TEST)).to.be.true
        const archive = parser.parse(TEST, 1, true) as Archive

        expect(archive).to.not.be.null
        expect(Object.keys(archive.collection).length).to.equal(2)
        
        const playlist = archive.playlists[0] as Playlist
        expect(playlist.tracks.length).to.equal(2)
    })

    it('can split title - album', () => {
        const TEST = `#EXTM3U
        #EXTINF:293,Block & Crown - Boogie Renegade (Original Mix)
        __FILE_PATH__
        `
        const parser = new M3UParser()
        expect(parser.supports(TEST)).to.be.true
        const archive = parser.parse(TEST, 1, true) as Archive

        expect(archive).to.not.be.null
        expect(Object.keys(archive.collection).length).to.equal(1)
        const track: ArchiveTrack = archive.collection['__FILE_PATH__'] as ArchiveTrack
        expect(track.artist).to.equal('Block & Crown')
        expect(track.title).to.equal('Boogie Renegade (Original Mix)')
        
        const playlist = archive.playlists[0] as Playlist
        expect(playlist.tracks.length).to.equal(1)
    })

    it('can handle no title - album split', () => {
        const TEST = `#EXTM3U
        #EXTINF:391,Angelo Ferreri  Man In Soul (Original Mix)
        __FILE_PATH__
        `
        const parser = new M3UParser()
        expect(parser.supports(TEST)).to.be.true
        const archive = parser.parse(TEST, 1, true) as Archive

        expect(archive).to.not.be.null
        expect(Object.keys(archive.collection).length).to.equal(1)
        const track: ArchiveTrack = archive.collection['__FILE_PATH__'] as ArchiveTrack
        expect(track.artist).to.equal('')
        expect(track.title).to.equal('Angelo Ferreri  Man In Soul (Original Mix)')
        
        const playlist = archive.playlists[0] as Playlist
        expect(playlist.tracks.length).to.equal(1)
    })

    it('can parser m3u8 files', () => {
        const p = `${__dirname}/../files/RekordBox_Rezidence20.m3u8`;
        fs.readFile(p, 'utf8', (err, data) => {
            expect(err).to.be.null
            const parser = new M3UParser()
            expect(parser.supports(data)).to.be.true
            const archive = parser.parse(data, 1, true) as Archive
            expect(archive).to.not.be.null
            expect(Object.keys(archive.collection).length).to.equal(11)
            expect(archive.playlists.length).to.equal(1)
            const playlist = archive.playlists[0] as Playlist
            expect(playlist.tracks.length).to.equal(11)
        })
    })
})