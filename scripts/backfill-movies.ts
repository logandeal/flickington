const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import fs from 'fs';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  setDoc,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getMovieWithProvidersById, MovieStub } from '../modules/movie';

function readMovieStubs(): MovieStub[] {
  if (!process.env.TMDB_MOVIES_FILE) {
    throw new Error('TMDB_MOVIES_FILE environment variable not specified.');
  }

  const moviesFileText = fs
    .readFileSync(process.env.TMDB_MOVIES_FILE)
    .toString();
  const moviesFileLines = moviesFileText.split('\n');

  const allMovies = moviesFileLines.reduce((result, line) => {
    try {
      result.push(JSON.parse(line));
    } catch (e) {
      // do nothing
    }
    return result;
  }, [] as any[]);

  const movies = allMovies.filter(
    (movie) => !movie.adult && movie.popularity >= 50
  );

  return movies;
}

async function delay(ms: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms >= 0 ? ms : 0);
  });
}

const MOVIE_REQUESTS_PER_SECOND = 10;

async function uploadMovies() {
  initializeApp({ projectId: 'flickington' });
  const db = getFirestore();
  connectFirestoreEmulator(db, 'localhost', 8080);

  const moviesRef = collection(db, 'movies');

  const movieStubs = readMovieStubs(); //.slice(0, 10);
  for (const movieStub of movieStubs) {
    const beginTime = Date.now();
    const movie = await getMovieWithProvidersById(movieStub.id);

    if (
      movie.providers.some((provider) => provider.provider_name === 'Netflix')
    ) {
      const providerIds = Array.from(
        new Set(movie.providers.map((provider) => provider.provider_id))
      );
      await setDoc(doc(moviesRef, `${movie.id}`), {
        name: movie.title,
        random: Math.random(),
        providers: providerIds,
      });
      console.log(`Uploaded: ${movie.title}`);
    }

    const endTime = Date.now();
    const delta = endTime - beginTime;
    const waitTimeInMs = 1000 / MOVIE_REQUESTS_PER_SECOND;
    const remainingTimeInMs = waitTimeInMs - delta;
    await delay(remainingTimeInMs);
  }
}

uploadMovies();
