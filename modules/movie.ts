import prisma from "../modules/prisma";

import { getRandomInt } from "./random";
import { getTmdbUrl } from "./tmdb";

export interface MovieError {
  error: string;
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface MovieProvider {
  provider_id: number;
  logo_path: string;
  provider_name: string;
  display_priority: number;
  type: string;
}

export interface MovieStub {
  id: number;
  original_title: string;
  popularity: number;
  adult: boolean;
}

export interface Movie extends MovieStub {
  title: string;
  overview: string;
  genres: MovieGenre[];
  original_language?: string;
  poster_path?: string;
  release_date?: string;
  tagline?: string;
  providers: MovieProvider[];
}

export class MovieNotFoundError extends Error {
  constructor(movieId?: number) {
    if (movieId) {
      super(`Movie not found: ${movieId}`);
    } else {
      super(`No movies found`);
    }
    this.name = "MovieNotFoundError";
    Object.setPrototypeOf(this, MovieNotFoundError.prototype);
  }
}

export async function getMovieById(id: number): Promise<Movie> {
  const response = await fetch(getTmdbUrl(`movie/${id}`), {
    cache: "no-store",
  });

  if (response.status !== 200) {
    throw new MovieNotFoundError(id);
  }

  const data = await response.json();

  return {
    providers: [],
    genres: [],
    ...data,
    poster_path:
      data.poster_path &&
      `https://image.tmdb.org/t/p/w188_and_h282_bestv2${data.poster_path}`,
  };
}

async function getMovieProviders(id: number) {
  const response = await fetch(getTmdbUrl(`movie/${id}/watch/providers`), {
    cache: "no-store",
  });

  if (response.status !== 200) {
    throw new MovieNotFoundError(id);
  }

  const data = await response.json();

  return data;
}

export async function getMovieWithProvidersById(id: number): Promise<Movie> {
  const [movie, providersByCountry] = await Promise.all([
    getMovieById(id),
    getMovieProviders(id),
  ]);

  const usProviders = providersByCountry?.results?.US || {};
  const providers = Object.keys(usProviders)
    .map((typeKey) => {
      const providersForType = usProviders[typeKey];
      if (Array.isArray(providersForType)) {
        return providersForType.map((provider) => ({
          ...{
            ...provider,
            logo_path: `https://www.themoviedb.org/t/p/original${provider.logo_path}`,
          },
          type: typeKey,
        }));
      }
      return [];
    })
    .flat();

  return {
    ...movie,
    providers,
  };
}

export async function getLatestMovie(): Promise<Movie> {
  const response = await fetch(getTmdbUrl(`movie/latest`));

  const data = await response.json();

  return data;
}
export interface MovieQueryOptions {
  providerIds?: number[];
  genreIds?: number[];
  languageCodes?: string[];
  releaseDateLte?: Date;
  releaseDateGte?: Date;
}

export async function getMaxDatabaseMovieId(): Promise<number> {
  const aggregates = await prisma.movie.aggregate({
    _max: {
      id: true,
    },
  });
  return aggregates._max.id || 0;
}

export async function getMinDatabaseMovieId(): Promise<number> {
  const aggregates = await prisma.movie.aggregate({
    _min: {
      id: true,
    },
  });
  return aggregates._min.id || 0;
}

export async function getNextDatabaseMovieId(afterId: number): Promise<number> {
  const aggregates = await prisma.movie.aggregate({
    _min: {
      id: true,
    },
    where: {
      id: {
        gt: afterId,
      },
    },
  });
  return aggregates._min.id || Infinity;
}

export async function doesDatabaseMovieExist(id: number): Promise<boolean> {
  const count = await prisma.movie.count({
    where: {
      id: id,
    },
  });
  return count > 0;
}

async function getMovieAtPosition(
  randomKey: number,
  op: string,
  {
    providerIds = [],
    genreIds = [],
    languageCodes = [],
    releaseDateLte = undefined,
    releaseDateGte = undefined,
  }: MovieQueryOptions = {}
): Promise<Movie> {
  const movie = await prisma.movie.findMany({
    take: 10,
    where: {
      AND: [
        {
          id: {
            [op]: randomKey,
          },
        },
        {
          language: languageCodes[0],
        },
        {
          release_date: {
            lte: releaseDateLte,
            gte: releaseDateGte,
          },
        },
        {
          searches: {
            some: {
              OR:
                providerIds.length > 0
                  ? providerIds.map((id) => ({
                      provider: id,
                    }))
                  : undefined,
            },
          },
        },
        {
          searches: {
            some: {
              OR:
                genreIds.length > 0
                  ? genreIds.map((id) => ({
                      genre: id,
                    }))
                  : undefined,
            },
          },
        },
      ],
    },
  });
  return movie[getRandomInt(0, movie.length)];
}

export async function getRandomMovieId(
  movieQueryOptions: MovieQueryOptions = {}
): Promise<number> {
  const maxMovieId = await getMaxDatabaseMovieId();
  const randomKey = getRandomInt(1, maxMovieId + 1);
  let movieAtPosition = await getMovieAtPosition(
    randomKey,
    "gte",
    movieQueryOptions
  );
  if (!movieAtPosition) {
    movieAtPosition = await getMovieAtPosition(
      randomKey,
      "lte",
      movieQueryOptions
    );
  }
  if (!movieAtPosition) {
    throw new MovieNotFoundError();
  }
  return movieAtPosition.id;
}

export interface MovieChange {
  id: number;
  adult: boolean;
}

export async function getMovieChanges(days: number): Promise<MovieChange[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceYear = since.getUTCFullYear();
  const sinceMonth = since.getUTCMonth() + 1; //months from 1-12
  const sinceDay = since.getUTCDate();
  const sinceString = `${sinceYear}-${String(sinceMonth).padStart(
    2,
    "0"
  )}-${String(sinceDay).padStart(2, "0")}`;
  const response = await fetch(
    getTmdbUrl("movie/changes") + `&start_date=${sinceString}`
  );
  const changes = (await response.json()).results as MovieChange[];
  return changes.filter((change) => change.adult === false);
}
