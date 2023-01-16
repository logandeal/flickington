import {
  getRandomMovieId,
  MovieError,
  MovieQueryOptions,
} from "../../../modules/movie";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  MovieNotFoundError,
  getMovieWithProvidersById,
  Movie,
  getLatestMovie,
} from "../../../modules/movie";

const MAX_ATTEMPT_COUNT = 25;

async function getRandomMovie(
  movieQueryOptions: MovieQueryOptions = {},
  attemptCount: number = 0
): Promise<Movie> {
  const movieId = await getRandomMovieId(movieQueryOptions);

  try {
    const movie = await getMovieWithProvidersById(movieId);

    if (movie.adult !== false) {
      return getRandomMovie(movieQueryOptions, attemptCount + 1);
    }

    movie.release_date = movie.release_date
      ? movie.release_date.replace(/-/g, "/")
      : "";

    return movie;
  } catch (e) {
    if (e instanceof MovieNotFoundError) {
      if (attemptCount >= MAX_ATTEMPT_COUNT) {
        throw new Error("Too many attempts to find random movie.");
      }
      return getRandomMovie(movieQueryOptions, attemptCount + 1);
    }
    throw e;
  }
}

function arrayify<T>(maybeArray: T | T[]): T[] {
  if (Array.isArray(maybeArray)) {
    return maybeArray;
  }
  return [maybeArray];
}

function getCommaSeparatedParameterValues(
  parameters: undefined | null | string | string[]
): string[] {
  if (!parameters) {
    return [];
  }
  return arrayify(parameters)
    .map((parameter) => parameter.split(","))
    .flat()
    .filter(Boolean);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Movie | MovieError>
) {
  const providerIds = getCommaSeparatedParameterValues(req.query.providers).map(
    Number
  );
  const genreIds = getCommaSeparatedParameterValues(req.query.genres).map(
    Number
  );
  const languageCodes = getCommaSeparatedParameterValues(req.query.languages);
  const releaseDateLteString = arrayify(req.query.release_date_lte)[0] ?? "";
  const releaseDateLte = releaseDateLteString
    ? new Date(releaseDateLteString)
    : undefined;
  const releaseDateGteString = arrayify(req.query.release_date_gte)[0] ?? "";
  const releaseDateGte = releaseDateGteString
    ? new Date(releaseDateGteString)
    : undefined;
  try {
    const movie = await getRandomMovie({
      providerIds,
      genreIds,
      languageCodes,
      releaseDateGte: releaseDateGte,
      releaseDateLte: releaseDateLte,
    });
    res.status(200).json(movie);
  } catch (e) {
    if (e instanceof MovieNotFoundError) {
      return res.status(404).json({
        error: "movie_not_found",
        message: "No movie found with that criteria.",
      });
    }
    throw e;
  }
}
