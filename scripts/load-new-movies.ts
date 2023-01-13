const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import commander, { program } from "commander";

function parseNumberOption(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}

program
  .option("-s, --start <number>", "Movie ID to start at", parseNumberOption)
  .option("-e, --end <number>", "Movie ID to end at", parseNumberOption);

program.parse();

import prisma from "../modules/prisma";

import {
  getMaxDatabaseMovieId,
  getLatestMovie,
  getMovieWithProvidersById,
  MovieNotFoundError,
  getNextDatabaseMovieId,
  doesDatabaseMovieExist,
} from "../modules/movie";

async function delay(ms: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms >= 0 ? ms : 0);
  });
}

const MOVIE_REQUESTS_PER_SECOND = 10;

async function loadNewMovies() {
  if (program.opts().start) {
    const doesStartMovieExist = await doesDatabaseMovieExist(
      program.opts().start
    );
    if (doesStartMovieExist) {
      console.warn(
        `Movie with ID ${program.opts().start} already exists in the database.`
      );
      console.warn(`Please choose a movie ID that hasn't already been loaded.`);
      return;
    }
  }
  const startMovieId = program.opts().start
    ? program.opts().start
    : (await getMaxDatabaseMovieId()) + 1;
  const latestMovie = await getLatestMovie();
  const nextDatabaseMovieId = await getNextDatabaseMovieId(startMovieId);
  const endMovieId = program.opts().end
    ? Math.min(program.opts().end, latestMovie.id, nextDatabaseMovieId - 1)
    : Math.min(latestMovie.id, nextDatabaseMovieId - 1);
  let movieAddedCount = 0;
  const movieLoad = await prisma.movie_load.create({
    data: {
      type: "load_span",
      start_id: startMovieId,
      end_id: endMovieId,
    },
  });
  for (let movieId = startMovieId; movieId <= endMovieId; movieId++) {
    const beginTime = Date.now();
    try {
      const movie = await getMovieWithProvidersById(movieId);
      if (movie.providers.length > 0 && movie.genres.length > 0) {
        const providers = movie.providers.filter(
          (provider) => provider.type === "flatrate" || provider.type === "ads"
        );
        const providerIds = Array.from(
          new Set(providers.map((provider) => provider.provider_id))
        );
        const genreIds = Array.from(
          new Set(movie.genres.map((genre) => genre.id))
        );
        const combos = providerIds
          .map((providerId) =>
            genreIds.map((genreId) => ({
              provider: providerId,
              genre: genreId,
            }))
          )
          .flat();
        await prisma.movie.create({
          data: {
            id: movieId,
            title: movie.title || "",
            release_date: movie.release_date
              ? new Date(movie.release_date)
              : null,
            language: movie.original_language || "",
            searches: {
              create: combos,
            },
          },
        });
        console.info(`Uploaded ${movie.id}: ${movie.title}`);
        movieAddedCount++;
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
  await prisma.movie_load.update({
    where: {
      id: movieLoad.id,
    },
    data: {
      completed_count: movieAddedCount,
    },
  });
  console.info(`Loaded ${movieAddedCount} movies.`);
}

loadNewMovies();
