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
  popularity: number;
  vote_average: number;
  vote_count: number;
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
    popularity: data.popularity || 0,
    vote_count: data.vote_count || 0,
    vote_average: data.vote_average || 0,
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

const validProviderTypes = ["flatrate", "ads", "free"];

export function isValidProviderType(providerType: string) {
  return validProviderTypes.includes(providerType);
}

export function isValidProvider(provider: MovieProvider) {
  return isValidProviderType(provider.type);
}

// All genre pairs
/*
[12, 14], // Adventure / Fantasy
[12, 16], // Adventure / Animation
[12, 18], // Adventure / Drama
[12, 27], // Adventure / Horror
[12, 28], // Adventure / Action
[12, 35], // Adventure / Comedy
[12, 36], // Adventure / History
[12, 37], // Adventure / Western
[12, 53], // Adventure / Thriller
[12, 80], // Adventure / Crime
[12, 99], // Adventure / Documentary
[12, 878], // Adventure / Science Fiction
[12, 9648], // Adventure / Mystery
[12, 10402], // Adventure / Music
[12, 10749], // Adventure / Romance
[12, 10751], // Adventure / Family
[12, 10752], // Adventure / War
[12, 10770], // Adventure / TV Movie
[14, 16], // Fantasy / Animation
[14, 18], // Fantasy / Drama
[14, 27], // Fantasy / Horror
[14, 28], // Fantasy / Action
[14, 35], // Fantasy / Comedy
[14, 36], // Fantasy / History
[14, 37], // Fantasy / Western
[14, 53], // Fantasy / Thriller
[14, 80], // Fantasy / Crime
[14, 99], // Fantasy / Documentary
[14, 878], // Fantasy / Science Fiction
[14, 9648], // Fantasy / Mystery
[14, 10402], // Fantasy / Music
[14, 10749], // Fantasy / Romance
[14, 10751], // Fantasy / Family
[14, 10752], // Fantasy / War
[14, 10770], // Fantasy / TV Movie
[16, 18], // Animation / Drama
[16, 27], // Animation / Horror
[16, 28], // Animation / Action
[16, 35], // Animation / Comedy
[16, 36], // Animation / History
[16, 37], // Animation / Western
[16, 53], // Animation / Thriller
[16, 80], // Animation / Crime
[16, 99], // Animation / Documentary
[16, 878], // Animation / Science Fiction
[16, 9648], // Animation / Mystery
[16, 10402], // Animation / Music
[16, 10749], // Animation / Romance
[16, 10751], // Animation / Family
[16, 10752], // Animation / War
[16, 10770], // Animation / TV Movie
[18, 27], // Drama / Horror
[18, 28], // Drama / Action
[18, 35], // Drama / Comedy
[18, 36], // Drama / History
[18, 37], // Drama / Western
[18, 53], // Drama / Thriller
[18, 80], // Drama / Crime
[18, 99], // Drama / Documentary
[18, 878], // Drama / Science Fiction
[18, 9648], // Drama / Mystery
[18, 10402], // Drama / Music
[18, 10749], // Drama / Romance
[18, 10751], // Drama / Family
[18, 10752], // Drama / War
[18, 10770], // Drama / TV Movie
[27, 28], // Horror / Action
[27, 35], // Horror / Comedy
[27, 36], // Horror / History
[27, 37], // Horror / Western
[27, 53], // Horror / Thriller
[27, 80], // Horror / Crime
[27, 99], // Horror / Documentary
[27, 878], // Horror / Science Fiction
[27, 9648], // Horror / Mystery
[27, 10402], // Horror / Music
[27, 10749], // Horror / Romance
[27, 10751], // Horror / Family
[27, 10752], // Horror / War
[27, 10770], // Horror / TV Movie
[28, 35], // Action / Comedy
[28, 36], // Action / History
[28, 37], // Action / Western
[28, 53], // Action / Thriller
[28, 80], // Action / Crime
[28, 99], // Action / Documentary
[28, 878], // Action / Science Fiction
[28, 9648], // Action / Mystery
[28, 10402], // Action / Music
[28, 10749], // Action / Romance
[28, 10751], // Action / Family
[28, 10752], // Action / War
[28, 10770], // Action / TV Movie
[35, 36], // Comedy / History
[35, 37], // Comedy / Western
[35, 53], // Comedy / Thriller
[35, 80], // Comedy / Crime
[35, 99], // Comedy / Documentary
[35, 878], // Comedy / Science Fiction
[35, 9648], // Comedy / Mystery
[35, 10402], // Comedy / Music
[35, 10749], // Comedy / Romance
[35, 10751], // Comedy / Family
[35, 10752], // Comedy / War
[35, 10770], // Comedy / TV Movie
[36, 37], // History / Western
[36, 53], // History / Thriller
[36, 80], // History / Crime
[36, 99], // History / Documentary
[36, 878], // History / Science Fiction
[36, 9648], // History / Mystery
[36, 10402], // History / Music
[36, 10749], // History / Romance
[36, 10751], // History / Family
[36, 10752], // History / War
[36, 10770], // History / TV Movie
[37, 53], // Western / Thriller
[37, 80], // Western / Crime
[37, 99], // Western / Documentary
[37, 878], // Western / Science Fiction
[37, 9648], // Western / Mystery
[37, 10402], // Western / Music
[37, 10749], // Western / Romance
[37, 10751], // Western / Family
[37, 10752], // Western / War
[37, 10770], // Western / TV Movie
[53, 80], // Thriller / Crime
[53, 99], // Thriller / Documentary
[53, 878], // Thriller / Science Fiction
[53, 9648], // Thriller / Mystery
[53, 10402], // Thriller / Music
[53, 10749], // Thriller / Romance
[53, 10751], // Thriller / Family
[53, 10752], // Thriller / War
[53, 10770], // Thriller / TV Movie
[80, 99], // Crime / Documentary
[80, 878], // Crime / Science Fiction
[80, 9648], // Crime / Mystery
[80, 10402], // Crime / Music
[80, 10749], // Crime / Romance
[80, 10751], // Crime / Family
[80, 10752], // Crime / War
[80, 10770], // Crime / TV Movie
[99, 878], // Documentary / Science Fiction
[99, 9648], // Documentary / Mystery
[99, 10402], // Documentary / Music
[99, 10749], // Documentary / Romance
[99, 10751], // Documentary / Family
[99, 10752], // Documentary / War
[99, 10770], // Documentary / TV Movie
[878, 9648], // Science Fiction / Mystery
[878, 10402], // Science Fiction / Music
[878, 10749], // Science Fiction / Romance
[878, 10751], // Science Fiction / Family
[878, 10752], // Science Fiction / War
[878, 10770], // Science Fiction / TV Movie
[9648, 10402], // Mystery / Music
[9648, 10749], // Mystery / Romance
[9648, 10751], // Mystery / Family
[9648, 10752], // Mystery / War
[9648, 10770], // Mystery / TV Movie
[10402, 10749], // Music / Romance
[10402, 10751], // Music / Family
[10402, 10752], // Music / War
[10402, 10770], // Music / TV Movie
[10749, 10751], // Romance / Family
[10749, 10752], // Romance / War
[10749, 10770], // Romance / TV Movie
[10751, 10752], // Family / War
[10751, 10770], // Family / TV Movie
[10752, 10770], // War / TV Movie
*/

const validGenrePairs = [
  [18, 35], // Drama / Comedy
  [28, 35], // Action / Comedy
  [35, 10749], // Comedy / Romance
];

export function getGenrePairs(movie: Movie) {
  const genreIds = new Set(movie.genres.map((genre) => genre.id));
  return validGenrePairs.filter(
    (pair) => genreIds.has(pair[0]) && genreIds.has(pair[1])
  );
}
