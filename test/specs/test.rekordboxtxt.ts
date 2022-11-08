import { expect } from 'chai'
import * as fs from 'fs';
import { Archive, ArchiveTrack, Playlist, PlaylistTrack } from '../../src/archive';
import {RekordBoxTXTParser} from '../../src/rekordboxtxt'

describe('RekordBox TXT Files', function () {
    it('ignores empty files', () => {
        const parser = new RekordBoxTXTParser()
        expect(parser.supports('')).to.be.false
    })

    it('handles empty platlists', () => {
        const parser = new RekordBoxTXTParser()
        const contents = '#	Artwork	Track Title	Artist	Album	Genre	BPM	Rating	Time	Key	Date Added'
        expect(parser.supports(contents)).to.be.true
        const archive = parser.parse(contents) as Archive
        expect(archive).to.exist
        expect(Object.keys(archive.collection).length).to.equal(0)
        expect(archive.playlists.length).to.equal(0)
    })

    it('is really simple', () => {
        const p = `${__dirname}/../files/RekordBox_Rezidence 22.txt`;
        fs.readFile(p, 'utf16le', (err, data) => {
            expect(err).to.be.null
            const parser = new RekordBoxTXTParser()
            expect(parser.supports(data)).to.be.true
            const archive = parser.parse(data) as Archive
            expect(archive).to.exist

            // Check Collection
            expect(Object.keys(archive.collection).length).to.equal(22)
            expect(archive.playlists.length).to.equal(1)
            const playlist: Playlist = archive.playlists[0] as Playlist
            expect(playlist.tracks.length).to.equal(22)

            const track = playlist.tracks[0] as PlaylistTrack
            expect(track.key).to.equal('1')
            expect(track.playedPublic).to.be.true

            const archiveTrack = archive.collection['1'] as ArchiveTrack
            expect(archiveTrack.artist).to.equal('Steven Weston feat. Låpsley')
            expect(archiveTrack.title).to.equal('Like I Used To')
            })
    })
})