const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  documentId,
} from "firebase/firestore";
import {
  getLatestMovie,
  getMovieWithProvidersById,
  MovieNotFoundError,
} from "../modules/movie";

import { getFirestoreDb } from "../modules/firebase";

async function getLatestDatabaseMovieId(): Promise<number> {
  const moviesRef = collection(getFirestoreDb(), "movies");
  const lastMovieQuery = await query(
    moviesRef,
    orderBy(documentId()),
    limit(1)
  );
  const lastMovieSnapshot = await getDocs(lastMovieQuery);
  if (lastMovieSnapshot.empty) {
    return 0;
  }
  return new Promise((resolve) => {
    lastMovieSnapshot.forEach((doc) => {
      resolve(Number(doc.id));
    });
  });
}

async function delay(ms: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms >= 0 ? ms : 0);
  });
}

const MOVIE_REQUESTS_PER_SECOND = 10;

async function loadNewMovies() {
  const latestMovie = await getLatestMovie();
  const latestDbId = await getLatestDatabaseMovieId();
  for (let movieId = latestDbId + 1; movieId <= latestMovie.id; movieId++) {
    const beginTime = Date.now();
    try {
      const movie = await getMovieWithProvidersById(movieId);
      if (movie.providers.length > 0) {
        const providerIds = Array.from(
          new Set(movie.providers.map((provider) => provider.provider_id))
        );
        const moviesRef = collection(getFirestoreDb(), "movies");
        await setDoc(doc(moviesRef, `${movie.id}`), {
          name: movie.title,
          random: Math.random(),
          providers: providerIds,
        });
        console.log(`Uploaded: ${movie.title}`);
      }
    } catch (e) {
      if (!(e instanceof MovieNotFoundError)) {
        throw e;
      }
    }

    const endTime = Date.now();
    const delta = endTime - beginTime;
    const waitTimeInMs = 1000 / MOVIE_REQUESTS_PER_SECOND;
    const remainingTimeInMs = waitTimeInMs - delta;
    await delay(remainingTimeInMs);
  }
  process.exit();
}

loadNewMovies();
