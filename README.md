# Traktor and RekordBox Track List Generator

A very simple web app to convert your Traktor and RekordBox playlists
into a human readable format.  Supports CUE, TXT, NML, M3U8 and XML
file formats. Tool is live on 
[GitHub Pages](https://troysandal.github.io/tracklist/).

## Developer Setup
- Requires NPM v8
- No need to build final `dist` folder, Github action will do it for you.

```sh
# Install dependencies
npm i

# Run locally
npm run debug

# Run tests
npm run test

# Debug Tests with Node
npm run test:debug
```