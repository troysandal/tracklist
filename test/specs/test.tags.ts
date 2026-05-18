import { expect } from 'chai'
import * as fs from 'fs'
import { Archive, Playlist } from '../../src/parsers/archive'
import { TraktorParser } from '../../src/parsers/traktor'
import { buildTags, buildArtistList } from '../../src/formatter'
require('jsdom-global')()
global.DOMParser = window.DOMParser

describe('Track Tags', () => {
  it('are generated', () => {
      const p = `${__dirname}/../files/Rezidence28.nml`;
      const fileContents = fs.readFileSync(p, 'utf8')
      const parser = new TraktorParser(fileContents)
      const archive:Archive = parser.parse() as Archive

      let playlist = archive.playlists[0] as Playlist
      const tags = buildTags(playlist)
      expect(tags.length).to.eq(24)
      expect(tags.indexOf('#marsh')).to.not.eq(-1)
  })
})

describe('Artist List', () => {
    let playlist: Playlist

    before(() => {
        const p = `${__dirname}/../files/Rezidence28.nml`;
        const fileContents = fs.readFileSync(p, 'utf8')
        const parser = new TraktorParser(fileContents)
        const archive: Archive = parser.parse() as Archive
        playlist = archive.playlists[0] as Playlist
    })

    it('is generated', () => {
        const artists = buildArtistList(playlist)
        expect(artists.length).to.be.greaterThan(0)
    })

    it('deduplicates artists', () => {
        const artists = buildArtistList(playlist)
        const unique = new Set(artists)
        expect(artists.length).to.eq(unique.size)
    })

    it('splits comma-separated artists into individual entries', () => {
        const fakePlaylist = {
            name: 'test',
            tracks: [
                { collectionEntry: { artist: 'Artist A, Artist B', title: '', key: '' }, key: '', playedPublic: true },
                { collectionEntry: { artist: 'Artist A', title: '', key: '' }, key: '', playedPublic: true },
            ],
            filter: () => fakePlaylist
        }
        const artists = buildArtistList(fakePlaylist)
        expect(artists).to.include('Artist A')
        expect(artists).to.include('Artist B')
        expect(artists.length).to.eq(2)
    })
})