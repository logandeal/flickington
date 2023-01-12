import prisma from "../modules/prisma";

import { getRandomInt } from "./random";

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
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    {
      cache: "no-store",
    }
  );

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
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    {
      cache: "no-store",
    }
  );

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
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/latest?api_key=${process.env.TMDB_API_KEY}&language=en-US`
  );

  const data = await response.json();

  return data;
}

export interface MovieQueryOptions {
  providerIds?: number[];
  genreIds?: number[];
  languageCodes?: string[];
  releaseDateBefore?: Date;
  releaseDateAfter?: Date;
}

export async function getLatestDatabaseMovieId(): Promise<number> {
  const aggregates = await prisma.movie.aggregate({
    _max: {
      id: true,
    },
  });
  return aggregates._max.id || 0;
}

async function getMovieAtPosition(
  randomKey: number,
  op: string,
  {
    providerIds = [],
    genreIds = [],
    languageCodes = [],
    releaseDateBefore = undefined,
    releaseDateAfter = undefined,
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
            lte: releaseDateBefore,
            gte: releaseDateAfter,
          },
        },
        {
          OR:
            providerIds.length > 0
              ? providerIds.map((id) => ({
                  providers: {
                    array_contains: [id],
                  },
                }))
              : undefined,
        },
        {
          OR:
            genreIds.length > 0
              ? genreIds.map((id) => ({
                  genres: {
                    array_contains: [id],
                  },
                }))
              : undefined,
        },
        // {
        //   genres:
        //     genreIds.length > 0
        //       ? {
        //           hasSome: genreIds,
        //         }
        //       : undefined,
        // },
        // {
        //   providers:
        //     providerIds.length > 0
        //       ? {
        //           hasSome: providerIds,
        //         }
        //       : undefined,
        // },
        // {
        //   genres:
        //     genreIds.length > 0
        //       ? {
        //           hasSome: genreIds,
        //         }
        //       : undefined,
        // },
      ],
    },
  });
  return movie[getRandomInt(0, movie.length)];
  // let q = query(moviesRef, where("random", op, randomKey));
  // if (providerIds.length > 0) {
  //   q = query(q, where("providers", "array-contains-any", providerIds));
  // }
  // if (genreIds.length > 0) {
  //   const randomGenreIndex = getRandomInt(0, genreIds.length);
  //   const spliced = genreIds.splice(randomGenreIndex, 1);
  //   genreIds.unshift(spliced[0]);
  //   q = query(q, where(`genres.${genreIds[0]}`, "==", true));
  // }
  // if (languageCodes.length > 0) {
  //   q = query(q, where("language", "==", languageCodes[0]));
  // }
  // if (releaseDateAfter) {
  //   q = query(q, where("release_date", ">=", releaseDateAfter));
  // }
  // if (releaseDateBefore) {
  //   q = query(q, where("release_date", ">=", releaseDateBefore));
  // }
  // q = query(q, orderBy("random"), limit(1));
  // const snapshot = await getDocs(q);
  // if (snapshot.empty) {
  //   if (genreIds.length > 1) {
  //     return getMovieAtPosition(randomKey, op, {
  //       providerIds,
  //       genreIds: genreIds.slice(1),
  //       languageCodes,
  //     });
  //   }
  // }
}

export async function getRandomMovieId(
  movieQueryOptions: MovieQueryOptions = {}
): Promise<number> {
  const maxMovieId = await getLatestDatabaseMovieId();
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
