import { expect } from 'chai'
import * as fs from 'fs';
import { Archive, ArchiveTrack, Playlist, PlaylistTrack } from '../../src/parsers/archive';
import {RekordBoxTXTParser} from '../../src/parsers/rekordboxtxt'
import { Buffer } from 'node:buffer';

describe('RekordBox TXT Parser', function () {
    it('ignores empty files', () => {
        const parser = new RekordBoxTXTParser('')
        expect(parser.supports()).to.be.false
    })

    it('handles empty playlists', () => {
        const contents = '#	Artwork	Track Title	Artist	Album	Genre	BPM	Rating	Time	Key	Date Added'
        const parser = new RekordBoxTXTParser(contents)
        expect(parser.supports()).to.be.true
        const archive = parser.parse() as Archive
        expect(archive).to.exist
        expect(Object.keys(archive.collection).length).to.equal(0)
        expect(archive.playlists.length).to.equal(0)
    })

    it('handles the Rezidence 22.txt', () => {
        const p = `${__dirname}/../files/RekordBox_Rezidence 22.txt`;
        const buffer:Buffer = fs.readFileSync(p)

        expect(buffer.length).to.be.greaterThanOrEqual(2)
        expect(buffer.length % 2).to.equal(0)        
        // Check for Little Endian - if big swap16()
        expect(buffer[0]).to.equal(0xff)
        expect(buffer[1]).to.equal(0xfe)

        const data:string = buffer.toString('ucs2', 2)
        expect(data).to.exist

        const parser = new RekordBoxTXTParser(data)
        expect(parser.supports()).to.be.true

        const archive = parser.parse() as Archive
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