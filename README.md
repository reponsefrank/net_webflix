# netwebfilx

A movie discovery and streaming-style web app built with **React**, **Vite** and
**React Router**. It ships with a local demo catalogue and **real poster images bundled in
`public/posters/`**, so every film shows genuine artwork with no API key and no
network access. Backdrops are generated on the fly, and a missing poster file
falls back to generated artwork automatically. Optionally, adding a TMDB API key
swaps in **posters fetched from TMDB** for every title (see "Real posters via
TMDB" below), and unlocks the **Explorer** - a TMDB-driven search for movies,
actors and directors with real photos, biographies and filmographies.

## Features

- **Netflix-style home page** (with a TMDB key): a big backdrop hero for a random
  trending film with **Play** / **More Info**, then horizontal **Trending**,
  **Popular**, **Top Rated** and **Upcoming** rows. Posters scale up on hover and
  open a player modal with the official YouTube trailer plus the title, rating,
  year and overview. Loading shows skeletons and a failed request shows a friendly
  error with a **Retry** button above the local catalogue.
- **Spotlight hero** (no key): rotates through featured local films every few seconds.
- **Home page** also keeps the local trending, top rated, new release and per-genre rows.
- **Browse page** with genre filters and sorting (trending, rating, newest, A-Z).
- **Search** by title, genre, director, cast or year, with relevance ranking.
- **Movie Night Picker** that matches films to a chosen mood, genre and maximum
  runtime, with loading, empty and error states.
- **Movie detail pages** with rating, runtime, cast, director and "more like this".
- **Play** in a responsive player modal: the official YouTube trailer resolved via TMDB,
  or a licensed/self-hosted file you declare. With no key and no licensed source, a
  friendly empty state is shown; the app never invents a video or streams a full movie.
- **Downloads** driven by an explicit, per-title authorized-source manifest - the Download
  button only appears when a real file is declared, and the app never fakes a link.
- **My list** watchlist persisted in `localStorage` (survives refreshes).
- **Responsive** layout: mobile nav drawer, fluid grids, horizontal row scrollers.
- **Keyboard friendly** focus styles and labelled controls.
- **Bundled film posters**: every catalogue title ships with a real poster image
  in `public/posters/`, shown with no API key (see "Poster images" below).
- **Real movie posters** via The Movie Database (optional API key) with loading,
  no-poster and error placeholders.
- **Explorer** (TMDB-only, requires the API key): search movies or
  actors/directors by name, then open TMDB-backed movie pages (release date,
  genres, score, cast) and person pages (biography, known-for, directed films,
  filmography).

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Project structure

```
src/
  App.jsx                    routes and page shell
  main.jsx                   app entry (router + providers)
  components/                Navbar, Hero, MovieRow, MovieCard, PickerCard, Poster, Footer, icons
                             HomeHero, HomeRow, HomeChips, HomeCard, TitleModal, PlaylistButton
                             ExplorerMovieCard, PersonCard, PersonPhoto
                             TrailerPlayer, VideoPlayerModal, DownloadPanel, DownloadExtras, MovieModal
  context/                   WatchlistContext, FavoritesContext, PlaylistContext
  data/movies.js             demo catalogue + search/similar helpers
  data/homeRows.js           homepage row config (createRow + genre rows)
  data/movieNight.js         Movie Night Picker moods, filtering + async service
  data/playback.js           licensed/self-hosted play-source manifest + helpers
  data/downloads.js          authorized download-source manifest + helpers
  lib/artwork.js             local SVG poster and backdrop generator
  lib/tmdb.js                TMDB search/details/trailer service + image URL builders (optional)
  pages/                     Home, Browse, SearchResults, MovieNight, MovieDetail, MyList, Playlist, NotFound
                             Explorer, ExplorerMovie, ExplorerPerson
  styles/index.css           all styling (single stylesheet, CSS variables)
public/
  posters/                   bundled poster images (<catalogue-id>.jpg) + SOURCES.md
  videos/sample-clip.mp4     generated placeholder clip used by the demo download
```

## Poster images

`public/posters/` contains one real poster per catalogue title, named after the
movie id in `src/data/movies.js` (for example `inception.jpg` for
`/movie/inception`). `src/data/movies.js` attaches the URL to every movie
(`posterFor(id)`), so `Poster` renders the real image on first paint with no API
key and no network access. If a file is missing the image request fails and
`Poster` falls back to generated artwork, then to a clean placeholder - never a
broken-image icon.

- To customise a poster, replace the file (keep the same name) with your own
  licensed image, or delete it to fall back to generated artwork.
- Sources and licensing for the bundled images are listed in
  `public/posters/SOURCES.md`. **They are copyrighted film posters** included for
  a private, non-commercial demo - do not redistribute or publish the folder
  as-is.

## Real posters via TMDB

Without a key the app renders the locally generated poster artwork, exactly as
before. To show the real posters, get a free key from
<https://www.themoviedb.org/settings/api>, copy `.env.example` to `.env` and set:

```bash
VITE_TMDB_API_KEY=your_key_here
```

Restart `npm run dev` so Vite picks up the new environment variable, then:

- every poster is looked up on TMDB by **title and release year**, so the
  artwork always belongs to the correct movie;
- poster URLs are built correctly from the TMDB image base URL and the search
  result's `poster_path`, e.g. `https://image.tmdb.org/t/p/w500/abc123.jpg`;
- lookups are cached in memory for the session, so scrolling never re-hits the
  API for the same title;
- while a poster is resolving you get a shimmer placeholder; if TMDB has no
  poster for a title, or the lookup/request fails, a clean "no poster"
  placeholder is shown instead – never a broken image and never a random
  poster.

The integration lives in `src/lib/tmdb.js` and is exercised through the
`Poster` component, which is used by `MovieCard`, `PickerCard`, `MovieModal`
and `MovieDetail` — i.e. every place a poster appears.

## Play & trailers

The **Play** button on the detail page opens a responsive video-player **modal**.
Source resolution (never guessed):

1. A **licensed** source declared for the title in `src/data/playback.js` is played in a
   native HTML5 `<video>` element. This is how you play a file you own or are licensed to
   distribute. If the file fails to load, the trailer is offered as a fallback.
2. Otherwise the **official trailer** is resolved through TMDB's `/movie/{id}/videos`
   data and embedded from YouTube (privacy-friendly `youtube-nocookie.com`).
3. If neither is available (no key, no trailer, no licensed source), a friendly message is
   shown. The app never invents a video URL and only ever plays the official trailer or a
   declared licensed source - never an unauthorized full-movie stream.

Hero "Play" deep-links to the detail page with the player already open, and the details
modal's "Play" opens the same player. Logic lives in `src/components/VideoPlayerModal.jsx`
(resolution/player) + `fetchMovieTrailer()` in `src/lib/tmdb.js` + `src/data/playback.js`
(licensed manifest). Preview the HTML5 player path with `?demo=play`, e.g.
`/movie/inception?demo=play` (uses the repo's generated sample clip, clearly labelled).

### Watch Trailer

The detail page also has a dedicated red **Watch Trailer** button. It opens the same
player in **trailer-only** mode: it skips licensed files and the demo clip and plays
exclusively the official TMDB trailer (Teaser/ Trailer YouTube videos, prioritized by
type, official flag and English language). When no trailer exists, or no `VITE_TMDB_API_KEY`
is configured, a friendly empty state is shown instead - no fabricated URLs. Closing the
modal unmounts the player, which stops playback.

## Downloads

Downloads are intentionally **data-driven and honest**. A title is downloadable
only when an operator declares an authorized source for it in
`src/data/downloads.js`, keyed by the local catalogue movie id:

```js
export const DOWNLOAD_SOURCES = {
  inception: {
    provider: { name: 'iTunes Store', url: 'https://...' }, // optional official page
    files: [
      { quality: '1080p', size: '5.2 GB', format: 'MP4', url: 'https://.../movie.mp4', streamable: true },
    ],
  },
}
```

The manifest ships **empty**, so the **Download button is hidden** on every title (both
the detail page and the details modal) — no fake download link is ever rendered. When an
authorized source is declared, the button appears and:

- an official **provider** link (store / rental / streaming) opens in a new tab;
- **streamable** files are fetched with a live progress bar and saved with a
  safe file name (`Inception (1080p).mp4`);
- non-streamable files use a native `<a download>` link;
- failures (network, CORS, missing file) surface an honest error, never a fake
  "complete".

Preview the UI states (and reveal the otherwise-hidden Download button) without a real file
by appending `?demo=download` to any movie URL, e.g. `/movie/inception?demo=download` — it
shows the demo row and ends in an honest failure. The UI is
`src/components/DownloadPanel.jsx`; the manifest + helpers are `src/data/downloads.js`.

### Also available

Alongside the authorized-source manifest, every title offers three real,
always-working downloads (`src/components/DownloadExtras.jsx`):

- **Poster image** - saves the title's poster as `<Title> (poster).jpg`;
- **Film details** - saves `<Title> (details).json` with the catalogue fields;
- **Sample clip** - a generated placeholder MP4
  (`public/videos/sample-clip.mp4`, made with ffmpeg) so the video download flow
  can be exercised end to end. It is clearly labelled a sample and is **not** the
  film.

So the Download area is useful with the shipped empty manifest, while any
full-movie download still requires an operator to declare an authorized source.

## Explorer (movies, actors & directors)

The Explorer is a second, fully TMDB-driven slice of the site (the local demo
catalogue is untouched). Routes:

| Route | Page |
|---|---|
| `/explorer` | Search TMDB for **movies** or **people** by name |
| `/explorer/movie/:id` | TMDB movie page: release date, genres, TMDB score, runtime, description, director and cast |
| `/explorer/person/:id` | TMDB person page: biography, birthday/birthplace, known-for titles, directed films and filmography |

Everything is keyed by real **TMDB ids** — posters, profile photos, cast and
filmography links all resolve through TMDB, so images are never guessed or
random. Loading states show a spinner/skeletons; requests that fail (invalid
key, rate limit, network) show an error state with a Retry button; missing
photos or biographies fall back to branded placeholders. All data is cached in
memory for the session to avoid re-fetching the same ids.

Like real posters, the Explorer only works when `VITE_TMDB_API_KEY` is set.

## Swapping in a real API

`src/data/movies.js` is the only place the app reads film data from. Replace the
`movies` array with data fetched from TMDB (or any other provider) mapped into
the same shape:

```js
{
  id, title, year, rating, runtime,
  genres: [], overview, tagline, director, cast: [],
  poster, // optional explicit image URL
  featured, trending
}
```

Poster resolution is already wired: a movie whose object carries a `poster`
URL uses it directly, and `src/lib/tmdb.js` handles fetching the rest from
TMDB. Backdrops remain locally generated in `src/lib/artwork.js`.

## Notes

- The "Play" button opens the responsive player modal: the official trailer (TMDB) or a
  licensed source declared in `src/data/playback.js` (see "Play & trailers" above). There
  is no unauthorized full-movie stream.
- A title's "Download" button only appears when a real authorized file is declared in
  `src/data/downloads.js` (empty by default, so the button is hidden) — use
  `?demo=download` to reveal it and preview the states. The always-available poster,
  film-details and sample-clip downloads are described under "Also available".
- Demo titles, ratings and credits are real film metadata; the overview text is
  original copy written for this project.
