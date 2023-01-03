"use client";
import { css } from "@emotion/react";
import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";
import {
  Button,
  Skeleton,
  Typography,
  AppBar,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CssBaseline,
  Grid,
  Toolbar,
  Container,
  Box,
} from "@mui/material";

const inter = Inter({ subsets: ["latin"] });

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

interface Movie {
  id: number;
  title: string;
  overview: string;
  genres: MovieGenre[];
  poster_path: string;
  release_date: string;
  tagline: string;
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

export default function Home() {
  return (
    <>
      {/* <Head>
        <title>Flickington</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main>
        <Typography variant="h1">Flickington</Typography>
        <Button variant="contained">Get Random Movie</Button>
        <br />
        <img src="/movie-reveal.png" height="75.985" width="182" />
      </main> */}
      <Head>
        <title>Flickington</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <CssBaseline />
      <AppBar position="relative" sx={{ p: 1, alignItems: "center" }}>
        <Toolbar variant="dense">
          <img src="/logo-white.png" height="68" width="94" />
          <Typography variant="h3" fontWeight={600} sx={{ ml: 1 }}>
            Flickington
          </Typography>
        </Toolbar>
      </AppBar>
      <main
        css={css`
          height: calc(100vh - 68px - 16px);
        `}
      >
        <div
          css={css`
            height: 100%;
            display: flex;
            justify-content: center;
            flex-direction: column;
          `}
        >
          <Card sx={{ margin: "auto", maxWidth: 345 }}>
            <CardContent>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                Find your next movie to watch!
              </Typography>
              <div
                css={css`
                  display: flex;
                  justify-content: center;
                  margin-top: 10px;
                `}
              >
                <Button variant="contained">Reveal Movie</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

/*
export default async function Home() {
  const latestMovieId = (await getLatestMovie()).id;

  const movie = await getRandomMovie(latestMovieId);

  return (
    <>
      <Head>
        <title>Flickington</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main>
        <h1>Flickington</h1>
        {movie.poster_path ? (
          <>
            <img
              src={`https://www.themoviedb.org/t/p/w188_and_h282_bestv2${movie.poster_path}`}
              height="282"
              width="182"
            />
            <br />
            <img src="/movie-reveal.png" height="75.985" width="182" />
          </>
        ) : (
          <Skeleton variant="rectangular" width={282} height={182} />
        )}
        <h2>{movie.title}</h2>
        {movie.release_date && (
          <p>
            Release Date: {new Date(movie.release_date).toLocaleDateString()}
          </p>
        )}
        {movie.genres && movie.genres.length > 0 && (
          <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
        )}
        <p>{movie.overview}</p>
      </main>
    </>
  );
}
*/
