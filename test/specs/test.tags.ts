import { expect } from 'chai'
import * as fs from 'fs'
import { Archive, Playlist } from '../../src/parsers/archive'
import { TraktorParser } from '../../src/parsers/traktor'
import { buildTags } from '../../src/formatter'
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