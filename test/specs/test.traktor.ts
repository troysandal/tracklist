import { expect } from 'chai'
import * as fs from 'fs'
import { Archive, Playlist } from '../../src/parsers/archive'
import { TraktorParser } from '../../src/parsers/traktor'
import { format } from '../../src/formatter'
require('jsdom-global')()
global.DOMParser = window.DOMParser

describe('Traktor Parser', () => {
    let fileContents = ''
    before(() => {
        const p = `${__dirname}/../files/Traktor_Rezidence23.nml`;
        fileContents = fs.readFileSync(p, 'utf8')
        expect(fileContents).to.exist
        expect(fileContents.length).to.be.greaterThan(0)
    })

    it('supports multiple playlists', () => {
        const p = `${__dirname}/../files/Traktor_Rezidence19.2.nml`;
        const fileContents = fs.readFileSync(p, 'utf8')
        expect(fileContents).to.exist
        expect(fileContents.length).to.be.greaterThan(0)
        const parser = new TraktorParser(fileContents)
        expect(parser.supports()).to.be.true
        const archive = parser.parse() as Archive
        expect(Object.keys(archive.collection).length).to.equal(22)
        expect(archive?.playlists.length).to.equal(2)
        expect(archive?.playlists[0]?.tracks.length).to.equal(22)
        expect(archive?.playlists[1]?.tracks.length).to.equal(22)
    })

    it('works on Rezidence23', () => {
        const parser = new TraktorParser(fileContents)
        const archive = parser.parse()
        expect(archive).to.exist
        if (archive) {
            expect(Object.keys(archive.collection).length).to.equal(17)
            expect(archive.playlists.length).to.equal(1)
            const playlist = archive.playlists[0] as Playlist
            expect(playlist.tracks.length).to.equal(19)
        }
    })

    it('strips zero hours', () => {
        const p = `${__dirname}/../files/Rezidence28.nml`;
        const fileContents = fs.readFileSync(p, 'utf8')
        expect(fileContents).to.exist
        expect(fileContents.length).to.be.greaterThan(0)
        const parser = new TraktorParser(fileContents)
        const archive = parser.parse()
        expect(archive).to.exist
        if (archive) {
            let playlist = archive.playlists[0] as Playlist
            playlist = playlist.filter(1, true)
            const formattedTrack = format(playlist, 0, '${OFFSET}')
            expect(formattedTrack).to.equal('00:00')
        }
    })

    describe('supports filtering', () => {
        let archive: Archive
        before(() => {
            const p = `${__dirname}/../files/history_2022y07m17d_20h06m38s.nml`;
            fileContents = fs.readFileSync(p, 'utf8')
            expect(fileContents).to.exist
            expect(fileContents.length).to.be.greaterThan(0)
            const parser = new TraktorParser(fileContents)
            archive = parser.parse() as Archive
            expect(Object.keys(archive.collection).length).to.equal(46)
            expect(archive.playlists[0]?.tracks.length).to.equal(54)
        })
        it('on start track', () => {
            const playlist = archive.playlists[0] as Playlist
            expect(playlist.filter(0, false).tracks.length).to.equal(54)
        })
        it('on played Public', () => {
            const playlist = archive.playlists[0] as Playlist
            expect(playlist.filter(0, false).tracks.length).to.equal(54)
            expect(playlist.filter(0, true).tracks.length).to.equal(46)
        })
        it('on both', () => {
            const playlist = archive.playlists[0] as Playlist
            expect(playlist.filter(18, false).tracks.length).to.equal(36)
            expect(playlist.filter(18, true).tracks.length).to.equal(35)
        })
    })
})