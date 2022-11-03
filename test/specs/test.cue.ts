import { expect } from 'chai'
import * as fs from 'fs';
import {cueReader, Command, cueParser} from '../../src/cue'
import {Archive, ArchiveTrack, PlaylistTrack} from '../../src/archive'

describe('CUE Files', function () {
    it('load file', () => {
        const p = `${__dirname}/../files/RekordBox_Music and Love.cue`;
        fs.readFile(p, 'utf8', (err, data) => {
            if (err) {
                // console.log(err)
            } else {
                // console.log(data)
            }
        })
    })
    describe('Playlists', () => {
        it('supports no playlists', () => {
            const TEST = `
                REM DATE 2022-10-29
                REM RECORDED_BY "rekordbox-dj"
                TITLE "Music and Love"
                PERFORMER "The Acidic Rabbi"
            `
            const archive:Archive = cueParser(TEST)
            expect(archive.playlists.length).to.equal(0)
            expect(archive.format).to.equal('CUE')
        })
        it('supports empty playlists', () => {
            const TEST = `
                REM DATE 2022-10-29
                REM RECORDED_BY "rekordbox-dj"
                TITLE "Music and Love"
                PERFORMER "The Acidic Rabbi"
                FILE "01 Music and Love.wav" WAVE
            `
            const archive:Archive = cueParser(TEST)
            expect(archive.playlists.length).to.equal(0)
            expect(archive.format).to.equal('CUE')
        })
        it('supports multiple tracks', () => {
            const TEST = `
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
            const archive:Archive = cueParser(TEST)
            expect(archive.format).to.equal('CUE')
            expect(Object.keys(archive.collection).length).to.equal(2)
            expect(archive.playlists.length).to.equal(1)
            if (archive.playlists[0]) {
                expect(archive.playlists[0].name).to.equal('Music and Love - The Acidic Rabbi')
                expect(archive.playlists[0].tracks.length).to.equal(2)

                // check first track
                let collectionTrack = archive.collection['01'] as ArchiveTrack
                expect(collectionTrack).to.not.be.null
                expect(collectionTrack.key).to.equal('01')
                expect(collectionTrack.artist).to.equal('Nile Delta, Knightlife, Chicken Lips, Tornado Wallace')
                expect(collectionTrack.title).to.equal('Channel')

                let playlistTrack = archive.playlists[0].tracks[0] as PlaylistTrack
                expect(playlistTrack.key).to.equal('01')
                expect(playlistTrack.collectionEntry).to.equal(collectionTrack)
                expect(playlistTrack.playedPublic).to.equal(true)

                // check second track
                collectionTrack = archive.collection['02'] as ArchiveTrack
                expect(collectionTrack).to.not.be.null
                expect(collectionTrack.key).to.equal('02')
                expect(collectionTrack.artist).to.equal('Bronx Cheer')
                expect(collectionTrack.title).to.equal('Westcoast Boogie')

                playlistTrack = archive.playlists[0].tracks[1] as PlaylistTrack
                expect(playlistTrack.key).to.equal('02')
                expect(playlistTrack.collectionEntry).to.equal(collectionTrack)
                expect(playlistTrack.playedPublic).to.equal(true)
            }
        })
    })
    describe('Commands', () => {
        it('have names', () => {
            const command = new Command('REM DATE 2022-10-29')
            expect(command.name).to.equal('REM')
        })
        it('can start with leading white space', () => {
            const command = new Command('\tREM DATE 2022-10-29')
            expect(command.name).to.equal('REM')
        })
        it('can have no params', () => {
            const command = new Command('\tTITLE')
            expect(command.stringParam()).to.equal(undefined)
        })
        it('have unquoted string params', () => {
            const command = new Command('\tTITLE Channel 5 News')
            expect(command.stringParam()).to.equal('Channel 5 News')
        })
        it('have quoted string params', () => {
            const command = new Command('\tTITLE "Channel 5 News"')
            expect(command.stringParam()).to.equal('Channel 5 News')
        })
        it('have quoted string params', () => {
            const command = new Command('\tTITLE "Channel" WAVE')
            expect(command.stringParam()).to.equal('Channel')
        })
        it('have embedded quote string params', () => {
            const command = new Command('\tTITLE Channel "5"')
            expect(command.stringParam()).to.equal('Channel "5"')
        })
        it('like index have time', () => {
            const command = new Command('		INDEX 01 00:00:00')
            expect(command.param(1)).to.equal('01')
            expect(command.param(2)).to.equal('00:00:00')
        })
    })
    describe('Header Commands', () => {
        it('header commands', () => {
            const TEST = `
                REM DATE 2022-10-29
                REM RECORDED_BY "rekordbox-dj"
                TITLE "Music and Love"
                PERFORMER "The Acidic Rabbi"
            `
            const EXPECTED = ['REM', 'REM', "TITLE", "PERFORMER"]
            let index = 0
            cueReader(TEST, (command:Command) => {
                expect(command.name).to.equal(EXPECTED[index])
                index++
            })
        })
    })
})
