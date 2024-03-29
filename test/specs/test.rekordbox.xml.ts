import { expect } from 'chai'
import * as fs from 'fs';
import { RekordBoxParser } from '../../src/parsers/rekordbox'

require('jsdom-global')()
global.DOMParser = window.DOMParser

describe('RekordBox XML Parser', () => {
    it('supports multiple playlists', () => {
        const p = `${__dirname}/../files/RekordBox.xml`;
        const fileContents = fs.readFileSync(p, 'utf8')
        expect(fileContents).to.exist
        expect(fileContents.length).to.be.greaterThan(0)
        const parser = new RekordBoxParser(fileContents)
        expect(parser.supports()).to.be.true
        const archive = parser.parse()
        expect(archive).to.exist
        if (archive) {
            expect(Object.keys(archive.collection).length).to.equal(39)
            expect(archive?.playlists.length).to.equal(3)
            expect(archive?.playlists[0]?.tracks.length).to.equal(22)
            expect(archive?.playlists[1]?.tracks.length).to.equal(0)
            expect(archive?.playlists[2]?.tracks.length).to.equal(11)
        }
    })
})