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
  Autocomplete,
  TextField,
  Stack,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  Input,
  OutlinedInput,
  Chip,
  MenuItem,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { LoadingButton, TimePicker } from "@mui/lab";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { Movie, MovieError, MovieGenre, MovieProvider } from "../modules/movie";
import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

function sortProviders(providers: MovieProvider[]) {
  return [...providers].sort((a, b) =>
    a.provider_name.localeCompare(b.provider_name)
  );
}

function ProviderPicker({
  onChange,
}: {
  onChange: (providers: MovieProvider[]) => void;
}) {
  const { isLoading, error, data } = useQuery<MovieProvider[], Error>(
    "providerData",
    () =>
      fetch("/api/providers")
        .then((res) => res.json())
        .then(sortProviders)
  );

  if (error) return <>An error has occurred: {error.message}</>;

  return (
    <Autocomplete
      multiple
      id="providers-select"
      options={data || []}
      getOptionLabel={(option) => option.provider_name}
      defaultValue={[]}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="Providers"
          placeholder={isLoading ? "Loading..." : "Type provider name..."}
        />
      )}
      onChange={(event: any, newProviders: any) => {
        onChange(newProviders);
      }}
    />
  );
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getGenrePairString(genre: MovieGenre) {
  return "" + genre.id + (genre.pair_id ? `:${genre.pair_id}` : "");
}

function GenrePicker({
  onChange,
}: {
  onChange: (genres: MovieGenre[]) => void;
}) {
  const [genrePairs, setGenrePairs] = useState<string[]>([]);

  const { isLoading, error, data } = useQuery<MovieGenre[], Error>(
    "genreData",
    () => fetch("/api/genres").then((res) => res.json())
  );

  const genreMap = useMemo(() => {
    return Object.fromEntries(
      (data || []).map((genre) => [getGenrePairString(genre), genre])
    );
  }, [data]);

  if (error) return <>An error has occurred: {error.message}</>;

  const handleChange = (event: SelectChangeEvent<typeof genrePairs>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const newGenrePairs = typeof value === "string" ? value.split(",") : value;
    onChange(
      (data || []).filter((genre) =>
        newGenrePairs.includes(getGenrePairString(genre))
      )
    );
    setGenrePairs(newGenrePairs);
  };

  const handleDelete = (genrePair: string) => {
    const newGenrePairs = genrePairs.filter((pair) => genrePair != pair);
    onChange(
      (data || []).filter((genre) =>
        newGenrePairs.includes(getGenrePairString(genre))
      )
    );
    setGenrePairs(newGenrePairs);
  };

  return (
    <div>
      <FormControl variant="standard" fullWidth>
        <InputLabel id="genres-input-label">Genres</InputLabel>
        <Select
          labelId="genres-select-label"
          id="genres-select"
          multiple
          value={genrePairs}
          onChange={handleChange}
          input={<Input key="" id="select-multiple-genre" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={genreMap[value].name}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  onDelete={() => handleDelete(value)}
                />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {(data || []).map((genre) => (
            <MenuItem
              key={getGenrePairString(genre)}
              value={getGenrePairString(genre)}
            >
              {genre.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

function YearPicker({
  onChange,
  label,
  value,
}: {
  onChange: (date: Dayjs | null) => void;
  label: string;
  value: Dayjs | null;
}) {
  return (
    <DatePicker
      views={["year"]}
      openTo="year"
      label={label}
      value={value}
      maxDate={dayjs(String(new Date().getFullYear()))}
      onChange={(date) => {
        if (date) {
          onChange(dayjs(String(date)));
        }
      }}
      renderInput={(params) => (
        <TextField {...params} helperText={null} variant="standard" />
      )}
    />
  );
}

function Home() {
  const [currentMovieState, setCurrentMovieState] = useState<{
    status: string;
    movie: Movie | null;
    error: MovieError | Error | null;
  }>({
    status: "initial",
    movie: null,
    error: null,
  });

  const [maybeListOpen, setMaybeListOpen] = useState<Boolean>(false);
  const [maybeList, setMaybeList] = useState<Number[]>([]);
  const [providers, setProviders] = useState<MovieProvider[]>([]);
  const [genres, setGenres] = useState<MovieGenre[]>([]);
  const [fromYear, setFromYear] = useState<Dayjs | null>(
    dayjs(String(new Date().getFullYear() - 10))
  );
  const [toYear, setToYear] = useState<Dayjs | null>(
    dayjs(String(new Date().getFullYear()))
  );

  async function loadRandomMovie() {
    setCurrentMovieState((state) => ({ ...state, status: "loading" }));
    try {
      const res = await fetch(
        "/api/movies/random?" +
          new URLSearchParams({
            providers: providers
              .map((provider) => provider.provider_id)
              .join(","),
            genres: genres.map((genre) => getGenrePairString(genre)).join(","),
            release_date_gte: fromYear ? `${fromYear.get("year")}-01-01` : "",
            release_date_lte: toYear ? `${toYear.get("year")}-12-31` : "",
            language_codes: "en",
          })
      );
      const movie = await res.json();
      if (movie.error) {
        setCurrentMovieState({
          status: "error",
          movie: null,
          error: movie,
        });
        return;
      }
      setCurrentMovieState({
        status: "loaded",
        movie,
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
          <div
            css={css`
              display: flex;
              justify-content: center;
              margin: 10px;
            `}
          >
            {maybeList.length > 0 && maybeListOpen && (
              <Card sx={{ margin: "auto" }}>
                <div
                  css={css`
                    display: flex;
                    margin: 10px;
                  `}
                >
                  <MaybeListButton
                    maybeListOpen={maybeListOpen}
                    setMaybeListOpen={setMaybeListOpen}
                  />
                </div>
              </Card>
            )}
            {maybeList.length > 0 && !maybeListOpen && (
              <MaybeListButton
                maybeListOpen={maybeListOpen}
                setMaybeListOpen={setMaybeListOpen}
              />
            )}
          </div>
          <Card sx={{ margin: "auto", maxWidth: 600 }}>
            <CardContent>
              <Typography
                variant="h4"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                Find your next movie now!
              </Typography>
              <div
                css={css`
                  display: flex;
                  justify-content: center;
                  margin-top: 10px;
                `}
              >
                <Stack spacing={3} sx={{ width: 500 }}>
                  <ProviderPicker onChange={setProviders} />
                  <GenrePicker onChange={setGenres} />
                  <Grid container columnSpacing={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Grid item>
                        <YearPicker
                          onChange={setFromYear}
                          label="From"
                          value={fromYear}
                        />
                      </Grid>
                      <Grid item>
                        <YearPicker
                          onChange={setToYear}
                          label="To"
                          value={toYear}
                        />
                      </Grid>
                    </LocalizationProvider>
                  </Grid>
                </Stack>
              </div>
              <div
                css={css`
                  display: flex;
                  justify-content: center;
                  margin: 25px;
                `}
              >
                {currentMovieState.status === "loading" ? (
                  <LoadingButton loading variant="contained">
                    Give Me a Movie
                  </LoadingButton>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      loadRandomMovie();
                    }}
                  >
                    Give Me a Movie
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
                  maybeList={maybeList}
                  setMaybeList={setMaybeList}
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
  maybeList,
  setMaybeList,
}: {
  movie: Movie | null;
  error: Error | MovieError | null;
  maybeList: Number[];
  setMaybeList: Function;
}) {
  if (error) {
    if ("error" in error && error.error === "movie_not_found") {
      return (
        <>
          Well, darn! We couldn&apos;t find a movie! Maybe try different
          options?
        </>
      );
    }
    return <>Error loading movie: {error.message}</>;
  }
  if (!movie) {
    return null;
  }
  return (
    <MovieContent
      key={movie.id}
      movie={movie}
      maybeList={maybeList}
      setMaybeList={setMaybeList}
    />
  );
}

export function MaybeListButton({
  maybeListOpen,
  setMaybeListOpen,
}: {
  maybeListOpen: Boolean;
  setMaybeListOpen: Function;
}) {
  return (
    <>
      <Button
        id="maybeListButton"
        variant="contained"
        endIcon={
          maybeListOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
        }
        onClick={() => {
          maybeListOpen ? setMaybeListOpen(false) : setMaybeListOpen(true);
        }}
      >
        Maybe List
      </Button>
    </>
  );
}

export function MovieContent({
  movie,
  maybeList,
  setMaybeList,
}: {
  movie: Movie;
  maybeList: Number[];
  setMaybeList: Function;
}) {
  const [moviePosterLoading, setMoviePosterLoading] = useState(
    movie.poster_path ? 1 : 0
  );

  const providers = sortProviders(movie.providers || []);

  return (
    <>
      {moviePosterLoading ? (
        <Skeleton variant="rectangular" width={182} height={264.5} />
      ) : null}
      {movie.poster_path && (
        <img
          id="posterImage"
          src={movie.poster_path}
          height="0"
          width="0"
          onLoad={() => {
            setMoviePosterLoading(0);
            var thisImg = document.getElementById("posterImage");
            if (thisImg != null) {
              thisImg.setAttribute("width", "182");
              thisImg.setAttribute("height", "282");
            }
          }}
        />
      )}
      <h2>{movie.title}</h2>
      {movie.release_date && (
        <p>Release Date: {new Date(movie.release_date).toLocaleDateString()}</p>
      )}
      {movie.genres && movie.genres.length > 0 && (
        <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
      )}
      <p>{movie.overview}</p>
      {providers.length > 0 && (
        <ul>
          {providers.map((provider, index) => (
            <li key={index}>
              {provider.provider_name} ({provider.type}):{" "}
              <img src={provider.logo_path} height="30" width="30" />
            </li>
          ))}
        </ul>
      )}
      <div
        css={css`
          display: flex;
          justify-content: center;
          margin-top: 10px;
        `}
      >
        {movie.title && (
          <Button
            variant="contained"
            onClick={() => {
              setMaybeList(maybeList.concat(movie.id));
            }}
          >
            Maybe
          </Button>
        )}
      </div>
    </>
  );
}
