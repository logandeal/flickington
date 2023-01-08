interface MovieGenre {
  id: number;
  name: string;
}

interface MovieProvider {
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
  genres?: MovieGenre[];
  poster_path?: string;
  release_date?: string;
  tagline?: string;
  providers: MovieProvider[];
}

export class MovieNotFoundError extends Error {
  constructor(movieId: number) {
    super(`Movie not found: ${movieId}`);
    this.name = 'MovieNotFoundError';
    Object.setPrototypeOf(this, MovieNotFoundError.prototype);
  }
}

export async function getMovieById(id: number): Promise<Movie> {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    {
      cache: 'no-store',
    }
  );

  if (response.status !== 200) {
    throw new MovieNotFoundError(id);
  }

  const data = await response.json();

  return {
    ...data,
    providers: [],
    poster_path:
      data.poster_path &&
      `https://image.tmdb.org/t/p/w188_and_h282_bestv2${data.poster_path}`,
  };
}

async function getMovieProviders(id: number) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    {
      cache: 'no-store',
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
