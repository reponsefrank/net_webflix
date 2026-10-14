/**
 * Demo catalog for netwebfilx.
 *
 * The app ships with this local data set so it runs with no API key and no
 * network access. Every entry follows the same shape, so swapping this file
 * for a real API (TMDB, OMDb, ...) only means mapping the response into the
 * same fields:
 *
 *   id, title, year, rating, runtime, genres, overview, director, cast,
 *   featured, trending, tagline
 */

const catalogue = [
  {
    id: 'inception',
    title: 'Inception',
    year: 2010,
    rating: 8.8,
    runtime: 148,
    genres: ['Sci-Fi', 'Thriller', 'Action'],
    overview:
      'A thief who steals secrets from inside peoples dreams is offered one last job: plant an idea in a rivals mind instead of taking one out.',
    tagline: 'Your mind is the scene of the crime.',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    featured: true,
    trending: true,
  },
  {
    id: 'the-dark-knight',
    title: 'The Dark Knight',
    year: 2008,
    rating: 9.0,
    runtime: 152,
    genres: ['Action', 'Crime', 'Drama'],
    overview:
      'A masked anarchist tears through a citys underworld, forcing a vigilante to decide how far he will go to stop him.',
    tagline: 'Why so serious?',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Gary Oldman'],
    featured: true,
    trending: true,
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    year: 2014,
    rating: 8.7,
    runtime: 169,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    overview:
      'With Earths crops failing, a former pilot joins a mission through a wormhole to find humanity a new home among the stars.',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    featured: true,
    trending: true,
  },
  {
    id: 'parasite',
    title: 'Parasite',
    year: 2019,
    rating: 8.5,
    runtime: 132,
    genres: ['Thriller', 'Drama', 'Comedy'],
    overview:
      'A struggling family talks its way into the household of the wealthy Parks, and the arrangement curdles into something far darker.',
    tagline: 'Act like you own the place.',
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
    trending: true,
  },
  {
    id: 'spider-verse',
    title: 'Spider-Man: Into the Spider-Verse',
    year: 2018,
    rating: 8.4,
    runtime: 117,
    genres: ['Animation', 'Action', 'Adventure'],
    overview:
      'A Brooklyn teenager gains spider powers and meets heroes from other dimensions who help him find his own way to wear the mask.',
    tagline: 'More than one wears the mask.',
    director: 'Bob Persichetti',
    cast: ['Shameik Moore', 'Jake Johnson', 'Hailee Steinfeld', 'Mahershala Ali'],
    featured: true,
    trending: true,
  },
  {
    id: 'grand-budapest',
    title: 'The Grand Budapest Hotel',
    year: 2014,
    rating: 8.1,
    runtime: 99,
    genres: ['Comedy', 'Drama', 'Adventure'],
    overview:
      'A legendary concierge and his loyal lobby boy chase a stolen painting, a family fortune and a very persistent assassin.',
    tagline: 'A perfect holiday, if you survive it.',
    director: 'Wes Anderson',
    cast: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan', 'Adrien Brody'],
  },
  {
    id: 'fury-road',
    title: 'Mad Max: Fury Road',
    year: 2015,
    rating: 8.1,
    runtime: 120,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    overview:
      'In a scorched wasteland, a drifter and a runaway commander flee a warlord across the desert in one long, roaring chase.',
    tagline: 'What a lovely day.',
    director: 'George Miller',
    cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult', 'Hugh Keays-Byrne'],
    trending: true,
  },
  {
    id: 'whiplash',
    title: 'Whiplash',
    year: 2014,
    rating: 8.5,
    runtime: 106,
    genres: ['Drama', 'Music'],
    overview:
      'A young drummer at an elite conservatory pushes himself to the brink under a teacher who believes cruelty makes greatness.',
    tagline: 'The road to greatness can take you to the edge.',
    director: 'Damien Chazelle',
    cast: ['Miles Teller', 'J.K. Simmons', 'Melissa Benoist', 'Paul Reiser'],
  },
  {
    id: 'arrival',
    title: 'Arrival',
    year: 2016,
    rating: 7.9,
    runtime: 116,
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    overview:
      'When alien vessels appear around the world, a linguist races to understand their language before fear starts a war.',
    tagline: 'Why are they here?',
    director: 'Denis Villeneuve',
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker', 'Michael Stuhlbarg'],
  },
  {
    id: 'get-out',
    title: 'Get Out',
    year: 2017,
    rating: 7.8,
    runtime: 104,
    genres: ['Horror', 'Thriller', 'Mystery'],
    overview:
      'A weekend with his girlfriends parents turns into a slow, smiling nightmare for a photographer who cant quite name what is wrong.',
    tagline: 'Just because youre invited doesnt mean youre welcome.',
    director: 'Jordan Peele',
    cast: ['Daniel Kaluuya', 'Allison Williams', 'Bradley Whitford', 'Catherine Keener'],
    trending: true,
  },
  {
    id: 'la-la-land',
    title: 'La La Land',
    year: 2016,
    rating: 8.0,
    runtime: 128,
    genres: ['Romance', 'Musical', 'Drama'],
    overview:
      'A jazz pianist and an aspiring actress fall in love in Los Angeles while chasing careers that keep pulling them apart.',
    tagline: 'Here is to the fools who dream.',
    director: 'Damien Chazelle',
    cast: ['Ryan Gosling', 'Emma Stone', 'John Legend', 'Rosemarie DeWitt'],
  },
  {
    id: 'knives-out',
    title: 'Knives Out',
    year: 2019,
    rating: 7.9,
    runtime: 130,
    genres: ['Mystery', 'Comedy', 'Crime'],
    overview:
      'After a crime novelist dies on his birthday, a patient detective untangles a household of heirs who all had a reason to lie.',
    tagline: 'Hell, of a family.',
    director: 'Rian Johnson',
    cast: ['Daniel Craig', 'Ana de Armas', 'Chris Evans', 'Jamie Lee Curtis'],
  },
  {
    id: 'dune-part-two',
    title: 'Dune: Part Two',
    year: 2024,
    rating: 8.5,
    runtime: 166,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    overview:
      'A young heir unites with the desert people of a spice world, torn between revenge and the war his visions promise.',
    tagline: 'Long live the fighters.',
    director: 'Denis Villeneuve',
    cast: ['Timothee Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    featured: true,
    trending: true,
  },
  {
    id: 'everything-everywhere',
    title: 'Everything Everywhere All at Once',
    year: 2022,
    rating: 7.8,
    runtime: 139,
    genres: ['Sci-Fi', 'Comedy', 'Action'],
    overview:
      'A laundromat owner auditing her taxes discovers she is the only person who can hold a collapsing multiverse together.',
    tagline: 'The universe is so much bigger than you realize.',
    director: 'Daniel Kwan',
    cast: ['Michelle Yeoh', 'Ke Huy Quan', 'Stephanie Hsu', 'Jamie Lee Curtis'],
    trending: true,
  },
  {
    id: 'the-batman',
    title: 'The Batman',
    year: 2022,
    rating: 7.8,
    runtime: 176,
    genres: ['Action', 'Crime', 'Mystery'],
    overview:
      'Two years into his war on crime, a detective in a cape follows a killers riddles into the rot at the heart of his city.',
    tagline: 'Unmask the truth.',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoe Kravitz', 'Paul Dano', 'Colin Farrell'],
  },
  {
    id: 'top-gun-maverick',
    title: 'Top Gun: Maverick',
    year: 2022,
    rating: 8.2,
    runtime: 130,
    genres: ['Action', 'Drama', 'Adventure'],
    overview:
      'A legendary test pilot returns to train a squad of graduates for a mission that demands everything he has left.',
    tagline: 'Feel the need.',
    director: 'Joseph Kosinski',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
    trending: true,
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    year: 2023,
    rating: 8.3,
    runtime: 180,
    genres: ['Drama', 'History', 'Thriller'],
    overview:
      'The physicist who built the bomb, and the hearing that spent years taking his name apart.',
    tagline: 'The world forever changes.',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.', 'Matt Damon'],
    featured: true,
    trending: true,
  },
  {
    id: 'barbie',
    title: 'Barbie',
    year: 2023,
    rating: 6.8,
    runtime: 114,
    genres: ['Comedy', 'Fantasy', 'Adventure'],
    overview:
      'A doll living in a plastic paradise travels to the real world and discovers it is a lot messier than the box suggests.',
    tagline: 'She is everything.',
    director: 'Greta Gerwig',
    cast: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera', 'Kate McKinnon'],
  },
  {
    id: 'shawshank',
    title: 'The Shawshank Redemption',
    year: 1994,
    rating: 9.3,
    runtime: 142,
    genres: ['Drama', 'Crime'],
    overview:
      'A quiet banker sentenced to life forms an unlikely friendship in prison and spends decades proving hope is not a luxury.',
    tagline: 'Fear can hold you prisoner. Hope can set you free.',
    director: 'Frank Darabont',
    cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton', 'William Sadler'],
  },
  {
    id: 'pulp-fiction',
    title: 'Pulp Fiction',
    year: 1994,
    rating: 8.9,
    runtime: 154,
    genres: ['Crime', 'Drama', 'Thriller'],
    overview:
      'Hitmen, a boxer and a gangsters wife collide across a handful of stories told out of order.',
    tagline: 'Just because you are a character does not mean you have character.',
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman', 'Bruce Willis'],
  },
  {
    id: 'spirited-away',
    title: 'Spirited Away',
    year: 2001,
    rating: 8.6,
    runtime: 125,
    genres: ['Animation', 'Fantasy', 'Adventure'],
    overview:
      'A sulky girl wanders into a world of spirits where her parents are turned to pigs and she must work to win them back.',
    tagline: 'The tunnel led to a world of wonder.',
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki', 'Takashi Naito'],
  },
  {
    id: 'the-godfather',
    title: 'The Godfather',
    year: 1972,
    rating: 9.2,
    runtime: 175,
    genres: ['Crime', 'Drama'],
    overview:
      'The aging head of a crime family hands his empire to the son who never wanted it.',
    tagline: 'An offer you cannot refuse.',
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan', 'Robert Duvall'],
  },
  {
    id: 'blade-runner-2049',
    title: 'Blade Runner 2049',
    year: 2017,
    rating: 8.0,
    runtime: 164,
    genres: ['Sci-Fi', 'Mystery', 'Drama'],
    overview:
      'A replicant officer unearths a secret buried long enough to unravel what is left of society, and himself.',
    tagline: 'The key to the future is finally unearthed.',
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks'],
  },
  {
    id: 'the-matrix',
    title: 'The Matrix',
    year: 1999,
    rating: 8.7,
    runtime: 136,
    genres: ['Sci-Fi', 'Action'],
    overview:
      'A hacker learns his life is a simulation and joins a crew fighting the machines that built it.',
    tagline: 'Free your mind.',
    director: 'Lana Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving'],
    trending: true,
  },
  {
    id: 'spotlight',
    title: 'Spotlight',
    year: 2015,
    rating: 8.1,
    runtime: 129,
    genres: ['Drama', 'History', 'Crime'],
    overview:
      'A newspapers investigative team follows a paper trail of complaints to a scandal the whole city looked away from.',
    tagline: 'Break the story. Break the silence.',
    director: 'Tom McCarthy',
    cast: ['Mark Ruffalo', 'Michael Keaton', 'Rachel McAdams', 'Liev Schreiber'],
  },
  {
    id: 'your-name',
    title: 'Your Name',
    year: 2016,
    rating: 8.4,
    runtime: 106,
    genres: ['Animation', 'Romance', 'Fantasy'],
    overview:
      'Two teenagers in different parts of Japan begin waking up in each others bodies, and start leaving notes to find each other.',
    tagline: 'Somewhere, someone is waiting.',
    director: 'Makoto Shinkai',
    cast: ['Ryunosuke Kamiki', 'Mone Kamishiraishi', 'Ryo Narita', 'Aoi Yuki'],
  },
  {
    id: 'john-wick',
    title: 'John Wick',
    year: 2014,
    rating: 7.4,
    runtime: 101,
    genres: ['Action', 'Thriller', 'Crime'],
    overview:
      'A retired hitman is dragged back into the underworld and takes the whole thing personally.',
    tagline: 'Dont set him off.',
    director: 'Chad Stahelski',
    cast: ['Keanu Reeves', 'Michael Nyqvist', 'Alfie Allen', 'Willem Dafoe'],
    trending: true,
  },
  {
    id: 'hereditary',
    title: 'Hereditary',
    year: 2018,
    rating: 7.3,
    runtime: 127,
    genres: ['Horror', 'Mystery', 'Drama'],
    overview:
      'After the family matriarch dies, her daughter inherits a grief that turns out to be something much older and hungrier.',
    tagline: 'Every family tree hides a secret.',
    director: 'Ari Aster',
    cast: ['Toni Collette', 'Alex Wolff', 'Milly Shapiro', 'Gabriel Byrne'],
  },
  {
    id: 'coco',
    title: 'Coco',
    year: 2017,
    rating: 8.4,
    runtime: 105,
    genres: ['Animation', 'Family', 'Fantasy'],
    overview:
      'A boy who dreams of music crosses into the land of the dead to find the great-great-grandfather his family forbade him to mention.',
    tagline: 'Remember me.',
    director: 'Lee Unkrich',
    cast: ['Anthony Gonzalez', 'Gael Garcia Bernal', 'Benjamin Bratt', 'Alanna Ubach'],
  },
  {
    id: 'sicario',
    title: 'Sicario',
    year: 2015,
    rating: 7.6,
    runtime: 121,
    genres: ['Crime', 'Thriller', 'Action'],
    overview:
      'An idealistic FBI agent is pulled into a task force whose methods are as brutal as the cartel it hunts.',
    tagline: 'The border is just another line to cross.',
    director: 'Denis Villeneuve',
    cast: ['Emily Blunt', 'Benicio del Toro', 'Josh Brolin', 'Victor Garber'],
  },
  {
    id: 'the-prestige',
    title: 'The Prestige',
    year: 2006,
    rating: 8.5,
    runtime: 130,
    genres: ['Drama', 'Mystery', 'Thriller'],
    overview:
      'Two stage magicians in Victorian London turn a friendly rivalry into an obsession that costs them everything.',
    tagline: 'Are you watching closely?',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Hugh Jackman', 'Scarlett Johansson', 'Michael Caine'],
  },
  {
    id: 'everything-is-fine',
    title: 'A Quiet Place',
    year: 2018,
    rating: 7.5,
    runtime: 90,
    genres: ['Horror', 'Sci-Fi', 'Thriller'],
    overview:
      'A family survives in near total silence, because anything louder than a whisper brings the creatures running.',
    tagline: 'If they hear you, they hunt you.',
    director: 'John Krasinski',
    cast: ['Emily Blunt', 'John Krasinski', 'Millicent Simmonds', 'Noah Jupe'],
    trending: true,
  },
  {
    id: 'free-solo',
    title: 'Free Solo',
    year: 2018,
    // Intentionally left unrated in this demo catalogue so the UI can show how
    // a missing score is handled. All other scores are the real film scores.
    rating: null,
    runtime: 100,
    genres: ['Documentary', 'Adventure'],
    overview:
      'A climber attempts the first free solo ascent of a 3,000 foot granite wall, counting every hold and every risk.',
    tagline: 'One slip is the end.',
    director: 'Elizabeth Chai Vasarhelyi',
    cast: ['Alex Honnold', 'Tommy Caldwell', 'Jimmy Chin'],
  },
  {
    id: 'my-octopus-teacher',
    title: 'My Octopus Teacher',
    year: 2020,
    rating: null,
    runtime: 85,
    genres: ['Documentary', 'Drama'],
    overview:
      'A filmmaker forms an unlikely bond with an octopus in a cold water kelp forest and follows her for a year.',
    tagline: 'A story of connection.',
    director: 'Pippa Ehrlich',
    cast: ['Craig Foster'],
  },
]

/**
 * Optional extra metadata (real production facts) kept separate so the core
 * catalogue shape above stays readable. Merged into every movie below.
 */
const movieMeta = {
  inception: { language: 'English', country: 'United States' },
  'the-dark-knight': { language: 'English', country: 'United States' },
  interstellar: { language: 'English', country: 'United States' },
  parasite: { language: 'Korean', country: 'South Korea' },
  'spider-verse': { language: 'English', country: 'United States' },
  'grand-budapest': { language: 'English', country: 'United States' },
  'fury-road': { language: 'English', country: 'Australia' },
  whiplash: { language: 'English', country: 'United States' },
  arrival: { language: 'English', country: 'United States' },
  'get-out': { language: 'English', country: 'United States' },
  'la-la-land': { language: 'English', country: 'United States' },
  'knives-out': { language: 'English', country: 'United States' },
  'dune-part-two': { language: 'English', country: 'United States' },
  'everything-everywhere': { language: 'English', country: 'United States' },
  'the-batman': { language: 'English', country: 'United States' },
  'top-gun-maverick': { language: 'English', country: 'United States' },
  oppenheimer: { language: 'English', country: 'United States' },
  barbie: { language: 'English', country: 'United States' },
  shawshank: { language: 'English', country: 'United States' },
  'pulp-fiction': { language: 'English', country: 'United States' },
  'spirited-away': { language: 'Japanese', country: 'Japan' },
  'the-godfather': { language: 'English', country: 'United States' },
  'blade-runner-2049': { language: 'English', country: 'United States' },
  'the-matrix': { language: 'English', country: 'United States' },
  spotlight: { language: 'English', country: 'United States' },
  'your-name': { language: 'Japanese', country: 'Japan' },
  'john-wick': { language: 'English', country: 'United States' },
  hereditary: { language: 'English', country: 'United States' },
  coco: { language: 'English', country: 'United States' },
  sicario: { language: 'English', country: 'United States' },
  'the-prestige': { language: 'English', country: 'United States' },
  'everything-is-fine': { language: 'English', country: 'United States' },
  'free-solo': { language: 'English', country: 'United States' },
  'my-octopus-teacher': { language: 'English', country: 'South Africa' },
}

/**
 * Local poster artwork.
 *
 * Every title in this catalogue ships with a real poster image at
 * `public/posters/<id>.jpg`, so the site shows film artwork with no API key and
 * no network access. Replace any file (keeping its name) with your own licensed
 * image, or delete it: a missing file automatically falls back to the generated
 * artwork in `src/lib/artwork.js`. Sources and licensing notes live in
 * `public/posters/SOURCES.md`.
 */
export function posterFor(id) {
  return `/posters/${id}.jpg`
}

export const movies = catalogue.map((movie) => ({
  ...movie,
  poster: posterFor(movie.id),
  ...(movieMeta[movie.id] ?? {}),
}))

/** All unique genres, alphabetically sorted. */
export const genres = Array.from(new Set(movies.flatMap((m) => m.genres))).sort()

export function getMovieById(id) {
  return movies.find((m) => m.id === id) ?? null
}

/** Movies that share at least one genre with the given movie. */
export function getSimilarMovies(movie, limit = 12) {
  return movies
    .filter((m) => m.id !== movie.id)
    .map((m) => ({ movie: m, score: m.genres.filter((g) => movie.genres.includes(g)).length }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.movie.rating ?? 0) - (a.movie.rating ?? 0))
    .slice(0, limit)
    .map((entry) => entry.movie)
}

/** Free-text search across title, genres, cast and director. */
export function searchMovies(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return movies
    .map((movie) => {
      const title = movie.title.toLowerCase()
      let score = 0
      if (title === q) score += 100
      if (title.startsWith(q)) score += 40
      if (title.includes(q)) score += 20
      if (movie.genres.some((g) => g.toLowerCase().includes(q))) score += 12
      if (movie.director.toLowerCase().includes(q)) score += 10
      if (movie.cast.some((c) => c.toLowerCase().includes(q))) score += 8
      if (String(movie.year).includes(q)) score += 6
      return { movie, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.movie.rating ?? 0) - (a.movie.rating ?? 0))
    .map((entry) => entry.movie)
}

export const trendingMovies = movies.filter((m) => m.trending)
export const featuredMovies = movies.filter((m) => m.featured)
export const topRatedMovies = [...movies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
export const newestMovies = [...movies].sort((a, b) => b.year - a.year)
