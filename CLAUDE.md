# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm i          # Install dependencies
npm run debug  # Run dev server (Parcel, hot reload)
npm run test   # Run all tests
npm run test:debug  # Run tests with Node inspector
npm run build  # Build to dist/
```

To run a single test file:
```sh
npx mocha --require ts-node/register test/specs/test.traktor.ts
```

## Architecture

This is a client-side TypeScript web app (no backend) built with Parcel. The entry point is `src/index.html` / `src/index.ts`.

### Data Flow

1. User uploads a playlist file in the browser
2. `parseArchive()` in `index.ts` tries each parser in order until one `supports()` the file
3. The matching parser returns a canonical `Archive` object (defined in `src/parsers/archive.ts`)
4. The `Archive` is rendered via `src/formatter.ts` using a user-configurable format string

### Core Types (`src/parsers/archive.ts`)

- **`Archive`** — top-level object: `{ collection, playlists[], format }`
- **`Collection`** — map of key → `ArchiveTrack` (track metadata: title, artist)
- **`Playlist`** / **`CPlaylist`** — named list of `PlaylistTrack[]`, with a `filter(startIndex, playedLive)` method
- **`PlaylistTrack`** — joins a playlist entry to its `collectionEntry` in the Collection; carries optional timing data (`startTimeJS`, `timeOffset`, `timeOffsetString`)
- **`Parser`** interface — `supports(): boolean` + `parse(): Archive | null`

### Parsers (`src/parsers/`)

Each parser implements the `Parser` interface and exposes a static `extensions` array used to populate the file input's `accept` attribute:

| File | Format | Key notes |
|------|--------|-----------|
| `traktor.ts` | Traktor NML (.nml) | XML; collection key built from LOCATION volume+dir+file; computes `timeOffset` per track relative to first track; extends `CPlaylist` to call `computeTrackOffsets` on filter |
| `rekordbox.ts` | RekordBox XML (.xml) | XML |
| `rekordboxtxt.ts` | RekordBox TXT (.txt) | Plain text |
| `m3u8.ts` | M3U8 (.m3u8) | Line-based |
| `cue.ts` | CUE sheet (.cue) | Line-based |

`common.ts` provides `querySelectorAllParents()` — a workaround for jsdom's lack of `>` CSS child combinator support, used in XML parsers.

### Formatter (`src/formatter.ts`)

- `TRACK_FIELDS` — map of token name → substitution function. Available tokens: `${INDEX}`, `${INDEX_PADDED}`, `${TITLE}`, `${ARTIST}`, `${OFFSET}`
- `playlistToReadable()` — outputs artist hashtags block followed by numbered track list
- `buildTags()` — splits artists on commas and generates `#lowercasenospace` hashtags

### Testing

Tests use Mocha + Chai with `ts-node` (configured in `.mocharc.yml`). XML parsers require jsdom:
```ts
require('jsdom-global')()
global.DOMParser = window.DOMParser
```
Test fixtures live in `test/files/` (real NML, XML, CUE, M3U8, TXT files).
