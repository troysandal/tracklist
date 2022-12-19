/// <reference types="cypress" />

describe('Traktor NML Files', () => {
  it('BUG: First track skipped', () => {
    cy.visit('http://127.0.0.1:1234')
    cy.get('input[type=file]').selectFile('test/files/history_2022y07m17d_20h06m38s.nml')
    cy.fixture('traktor.txt').then((formatted) => {
      cy.get('pre#trackList').should('have.text', formatted)
    })
  })

  it('supports track offset', () => {
    cy.visit('http://127.0.0.1:1234')
    cy.get('input[type=file]').selectFile('test/files/history_2022y07m17d_20h06m38s.nml')
    cy.get('input#startTrackIndex').first().clear().type('18')
    cy.fixture('traktor.trackoffset.txt').then((formatted) => {
      cy.get('pre#trackList').should('have.text', formatted)
    })
  })

  it('shows only played track', () => {
    cy.visit('http://127.0.0.1:1234')
    cy.get('input[type=file]').selectFile('test/files/history_2022y07m17d_20h06m38s.nml')
    cy.get('input#publicTracks').first().check()
    cy.fixture('traktor.publictracks.txt').then((formatted) => {
      cy.get('pre#trackList').should('have.text', formatted)
    })
  })
})