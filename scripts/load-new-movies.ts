const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import prisma from "../modules/prisma";

import {
  getLatestDatabaseMovieId,
  getLatestMovie,
  getMovieWithProvidersById,
  MovieNotFoundError,
} from "../modules/movie";

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
        const genreIds = Array.from(
          new Set(movie.genres.map((genre) => genre.id))
        );
        await prisma.movie.create({
          data: {
            id: movieId,
            title: movie.title || "",
            release_date: movie.release_date
              ? new Date(movie.release_date)
              : null,
            language: movie.original_language || "",
            providers: providerIds,
            genres: genreIds,
            // random: getUnsignedRandomInt63(),
          },
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
}

loadNewMovies();
