// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

async function getLatestMovie() {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/latest?api_key=${process.env.TMDB_API_KEY}&language=en-US`
  );

  const data = await response.json();

  return data;
}

class MovieNotFoundError extends Error {
  constructor(movieId: number) {
    super(`Movie not found: ${movieId}`);
    this.name = "MovieNotFoundError";
  }
}

async function getMovieById(id: number) {
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

  return data;
}

const MAX_ATTEMPT_COUNT = 25;

interface MovieGenre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  genres?: MovieGenre[];
  poster_path?: string;
  release_date?: string;
  tagline?: string;
}

async function getRandomMovie(
  maxId: number,
  attemptCount: number = 0
): Promise<Movie> {
  const movieId = getRandomInt(maxId) + 1;

  try {
    const movie = await getMovieById(movieId);

    if (movie.adult) {
      return getRandomMovie(maxId, attemptCount + 1);
    }

    movie.release_date = movie.release_date
      ? movie.release_date.replace("-", "/")
      : "";

    return movie;
  } catch (e) {
    if (e instanceof MovieNotFoundError) {
      if (attemptCount >= MAX_ATTEMPT_COUNT) {
        throw new Error("Too many attempts to find random movie.");
      }
      return getRandomMovie(maxId, attemptCount + 1);
    }
    throw e;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Movie>
) {
  const latestMovieId = (await getLatestMovie()).id;

  const movie = await getRandomMovie(latestMovieId);
  // const movie = {
  //   id: Math.floor(Math.random() * 10000),
  //   title: "foofoo",
  //   overview: "interesting",
  // };
  res.status(200).json(movie);
}
