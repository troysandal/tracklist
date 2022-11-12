import { expect } from 'chai'
import * as fs from 'fs';
import { RekordBoxParser } from '../../src/rekordbox'

require('jsdom-global')()
global.DOMParser = window.DOMParser

describe('RekordBox XML Parser', () => {
    it('has the jsdom parser available', () => {
        expect(DOMParser).to.exist
    })

    it('supports multiple playlists', () => {
        const p = `${__dirname}/../files/RekordBox.xml`;
        const fileContents = fs.readFileSync(p, 'utf8')
        expect(fileContents).to.exist
        expect(fileContents.length).to.be.greaterThan(0)
        const parser = new RekordBoxParser()
        const archive = parser.parse(fileContents)
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