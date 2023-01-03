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
import { LoadingButton, TimePicker } from "@mui/lab";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { Movie } from "./api/movie";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

function Home() {
  const [movieNumber, setMovieNumber] = useState(0);

  return (
    <>
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
          <Card sx={{ margin: "auto", maxWidth: 600 }}>
            <CardContent>
              <Typography
                variant="h4"
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
                <Button
                  variant="contained"
                  onClick={() => {
                    setMovieNumber(
                      (currentMovieNumber) => currentMovieNumber + 1
                    );
                  }}
                >
                  Reveal Movie
                </Button>
              </div>
              <div
                css={css`
                  margin-top: 10px;
                `}
              >
                {movieNumber ? <MovieContent key={movieNumber} /> : null}
              </div>
            </CardContent>
          </Card>
          <div
            css={css`
              display: flex;
              justify-content: center;
            `}
          >
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              This project uses the &nbsp;
            </Typography>
            <img src="/TMDB.svg" height="35" width="80" />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              &nbsp; API but is not endorsed or certified by &nbsp;
            </Typography>
            <img src="/TMDB.svg" height="35" width="80" />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              .
            </Typography>
          </div>
        </div>
      </main>
    </>
  );
}

export function MovieContent() {
  const { isLoading, error, data } = useQuery<Movie, Error>("randomMovie", () =>
    fetch("/api/movie").then((res) => res.json())
  );

  if (isLoading)
    return (
      <LoadingButton loading variant="contained">
        Reveal Movie
      </LoadingButton>
    );

  if (error) return <>An error has occurred: {error.message}</>;

  if (!data) return <>WTF no movie?</>;

  const movie = data;

  return (
    <>
      {movie.poster_path ? (
        <>
          <img
            src={`https://www.themoviedb.org/t/p/w188_and_h282_bestv2${movie.poster_path}`}
            height="282"
            width="182"
          />
        </>
      ) : (
        <Skeleton variant="rectangular" width={282} height={182} />
      )}
      <h2>{movie.title}</h2>
      {movie.release_date && (
        <p>Release Date: {new Date(movie.release_date).toLocaleDateString()}</p>
      )}
      {movie.genres && movie.genres.length > 0 && (
        <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
      )}
      <p>{movie.overview}</p>
    </>
  );
}
