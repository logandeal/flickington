"use client";
import { CacheProvider, css } from "@emotion/react";
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
  const [currentMovieState, setCurrentMovieState] = useState<{
    status: string;
    movie: Movie | null;
    error: Error | null;
  }>({
    status: "initial",
    movie: null,
    error: null,
  });

  async function loadRandomMovie() {
    setCurrentMovieState((state) => ({ ...state, status: "loading" }));
    try {
      const res = await fetch("/api/movie");
      setCurrentMovieState({
        status: "loaded",
        movie: await res.json(),
        error: null,
      });
    } catch (e) {
      setCurrentMovieState({
        status: "error",
        movie: null,
        error: e as Error,
      });
    }
  }

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
          // height: calc(100vh - 68px - 16px);
        `}
      >
        <div
          css={css`
            margin-top: 10px;
            // height: 100%;
            // display: flex;
            // justify-content: center;
            // flex-direction: column;
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
                {currentMovieState.status === "loading" ? (
                  <LoadingButton loading variant="contained">
                    Reveal Movie
                  </LoadingButton>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      loadRandomMovie();
                    }}
                  >
                    Reveal Movie
                  </Button>
                )}
              </div>
              <div
                css={css`
                  margin-top: 10px;
                `}
              >
                <MovieContentOrError
                  movie={currentMovieState.movie}
                  error={currentMovieState.error}
                />
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

export function MovieContentOrError({
  movie,
  error,
}: {
  movie: Movie | null;
  error: Error | null;
}) {
  if (error) {
    return <>Error loading movie: {error.message}</>;
  }
  if (!movie) {
    return null;
  }
  return <MovieContent key={movie.id} movie={movie} />;
}

export function MovieContent({ movie }: { movie: Movie }) {
  return (
    <>
      {movie.poster_path && (
        <>
          <img src={movie.poster_path} height="282" width="182" />
        </>
      )}
      <h2>{movie.title}</h2>
      {movie.release_date && (
        <p>Release Date: {new Date(movie.release_date).toLocaleDateString()}</p>
      )}
      {movie.genres && movie.genres.length > 0 && (
        <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
      )}
      <p>{movie.overview}</p>
      {movie.providers && movie.providers.length > 0 && (
        <ul>
          {movie.providers.map((provider) => (
            <li>
              {provider.provider_name} ({provider.type}):{" "}
              <img src={provider.logo_path} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
