const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

import fs from "fs";
import commander, { Option, program } from "commander";

function parseNumberOption(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}

program
  .option("-s, --start <number>", "Movie ID to start at", parseNumberOption)
  .option("-e, --end <number>", "Movie ID to end at", parseNumberOption)
  .option(
    "-n, --number <number>",
    "Max number of movies to load",
    parseNumberOption
  )
  .option(
    "-t, --time <number>",
    "Max time (in seconds) to load",
    parseNumberOption
  )
  .option("-d, --days <number>", "Days of changes", parseNumberOption)
  .option("--db", "Write results to database")
  .option(
    "-r, --random <number>",
    "Sample number of random IDs",
    parseNumberOption
  )
  .option("-f, --file <string>", "File name to output");

program.parse();

import prisma from "../modules/prisma";

import {
  getMaxDatabaseMovieId,
  getLatestMovie,
  MovieNotFoundError,
  getNextDatabaseMovieId,
  doesDatabaseMovieExist,
  getMovieChanges,
  getMinDatabaseMovieId,
  Movie,
  isValidProvider,
  getGenrePairs,
  getMovieById,
} from "../modules/movie";
import { getRandomIntSetInRange } from "../modules/random";

async function delay(ms: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms >= 0 ? ms : 0);
  });
}

const MOVIE_REQUESTS_PER_SECOND = 10;

function getMovieData(movie: Movie) {
  if (movie.providers.length === 0 || movie.genres.length === 0) {
    return undefined;
  }
  const providers = movie.providers.filter(isValidProvider);
  const providerIds = Array.from(
    new Set(providers.map((provider) => provider.provider_id))
  );
  const genreIds = Array.from(new Set(movie.genres.map((genre) => genre.id)));
  const combos = providerIds
    .map((providerId) =>
      genreIds
        .map((genreId) => ({
          provider: providerId,
          genre: genreId,
          genre_pair: 0,
        }))
        .concat(
          getGenrePairs(movie).map((pair) => ({
            provider: providerId,
            genre: pair[0],
            genre_pair: pair[1],
          }))
        )
    )
    .flat();

  const sortedReleaseDates = movie.release_dates
    .slice(0)
    .sort((a, b) => b.release_date.localeCompare(a.release_date));

  return {
    id: movie.id,
    title: movie.title || "",
    release_date: movie.release_date ? new Date(movie.release_date) : null,
    language: movie.original_language || "",
    popularity: movie.popularity || 0,
    vote_average: movie.vote_average || 0,
    vote_count: movie.vote_count || 0,
    searches: {
      create: combos,
    },
    certification: sortedReleaseDates[0]
      ? sortedReleaseDates[0].certification
      : "",
  };
}

async function loadNewMovies() {
  const maxMovieId = await getMaxDatabaseMovieId();
  const minMovieId = maxMovieId ? await getMinDatabaseMovieId() : 0;

  const shouldWriteToDb = program.opts().db;

  if (!shouldWriteToDb && !program.opts().file) {
    console.warn(`You must write to a db or file.`);
    return;
  }

  if (program.opts().days && maxMovieId && shouldWriteToDb) {
    const changes = await getMovieChanges(program.opts().days);
    const relevantChanges = changes.filter(
      (change) => change.id >= minMovieId && change.id <= maxMovieId
    );
    console.info(
      `${relevantChanges.length} movies in database ID range have changed.`
    );
    let movieChangedCount = 0;
    const movieLoad = await prisma.movie_load.create({
      data: {
        type: "load_changes",
        start_id: minMovieId,
        end_id: maxMovieId,
      },
    });
    console.info(`Checking for relevant changes...`);
    for (const change of relevantChanges) {
      const beginTime = Date.now();
      try {
        const movie = await getMovieById(change.id, [
          "providers",
          "release_dates",
        ]);
        const data = getMovieData(movie);
        if (data) {
          try {
            await prisma.movie.update({
              where: {
                id: movie.id,
              },
              data,
            });
          } catch (e) {
            // Assume that the movie didn't exist and needs to be created.
            await prisma.movie.create({
              data,
            });
          }
          console.info(`Updated ${movie.id}: ${movie.title}`);
          movieChangedCount++;
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
        completed_count: movieChangedCount,
      },
    });
    console.info(`Updated ${movieChangedCount} movies.`);
  }

  if (program.opts().start && shouldWriteToDb) {
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

  if (!shouldWriteToDb) {
    if (!program.opts().start) {
      console.warn(`Please choose a starting movie ID.`);
      return;
    }
  }

  const startMovieId = program.opts().start
    ? program.opts().start
    : maxMovieId + 1;
  const latestMovie = await getLatestMovie();
  const nextDatabaseMovieId = shouldWriteToDb
    ? await getNextDatabaseMovieId(startMovieId)
    : latestMovie.id + 1;
  const endMovieId = program.opts().end
    ? Math.min(program.opts().end, latestMovie.id, nextDatabaseMovieId - 1)
    : Math.min(latestMovie.id, nextDatabaseMovieId - 1);
  let movieAddedCount = 0;
  const movieLoad = shouldWriteToDb
    ? await prisma.movie_load.create({
        data: {
          type: "load_span",
          start_id: startMovieId,
          end_id: endMovieId,
        },
      })
    : { id: 0 };
  if (program.opts().file) {
    fs.writeFileSync(program.opts().file, "[\n");
  }
  const randomSet = program.opts().random
    ? getRandomIntSetInRange(
        startMovieId,
        endMovieId + 1,
        program.opts().random
      )
    : new Set();

  console.info(
    `Loading movies in ID range from ${startMovieId} to ${endMovieId}.`
  );
  if (randomSet.size > 0) {
    console.info(`Sampling ${randomSet.size} IDs in that range.`);
  }

  let elapsedApiTime = 0;
  let elapsedDbTime = 0;
  let startLoadTime = Date.now();

  let movieApiCount = 0;

  for (let movieId = startMovieId; movieId <= endMovieId; movieId++) {
    if (randomSet.size > 0 && !randomSet.has(movieId)) {
      continue;
    }
    if (
      typeof program.opts().number === "number" &&
      movieAddedCount >= program.opts().number
    ) {
      break;
    }
    const beginTime = Date.now();
    if (typeof program.opts().time === "number") {
      if ((beginTime - startLoadTime) / 1000 > program.opts().time) {
        break;
      }
    }
    movieApiCount++;
    try {
      const movie = await getMovieById(movieId, ["providers", "release_dates"]);
      const endApiTime = Date.now();
      elapsedApiTime = elapsedApiTime + (endApiTime - beginTime);
      const data = getMovieData(movie);
      if (data) {
        if (shouldWriteToDb) {
          const beginDbTime = Date.now();
          await prisma.movie.create({ data });
          const endDbTime = Date.now();
          elapsedDbTime = elapsedDbTime + (endDbTime - beginDbTime);
        }
        if (program.opts().file) {
          fs.appendFileSync(
            program.opts().file,
            (movieAddedCount > 0 ? ",\n" : "") + JSON.stringify(movie)
          );
        }
        console.info(`Loaded ${movie.id}: ${movie.title}`);
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
  if (program.opts().file) {
    fs.appendFileSync(
      program.opts().file,
      (movieAddedCount > 0 ? "\n" : "") + "]\n"
    );
  }
  if (shouldWriteToDb) {
    await prisma.movie_load.update({
      where: {
        id: movieLoad.id,
      },
      data: {
        completed_count: movieAddedCount,
      },
    });
  }
  const elapsedSeconds = Math.round((Date.now() - startLoadTime) / 10) / 100;
  console.info(`Loaded ${movieAddedCount} movies in ${elapsedSeconds}s.`);
  console.info(
    `Elapsed API time: ${Math.round(elapsedApiTime / 10) / 100}s (${
      Math.round(elapsedApiTime / movieApiCount / 10) / 100
    }s per ID)`
  );
  console.info(
    `Elapsed DB time: ${Math.round(elapsedDbTime / 10) / 100}s (${
      Math.round(elapsedDbTime / movieAddedCount / 10) / 100
    }s per movie)`
  );
}

loadNewMovies();
