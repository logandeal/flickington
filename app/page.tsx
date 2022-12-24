import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";

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

async function getMovieById(id: number) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  return data;
}

export default async function Home() {
  const latestMovieId = (await getLatestMovie()).id;

  const movieId = getRandomInt(latestMovieId) + 1;
  console.log(movieId);

  const movie = await getMovieById(movieId);

  return (
    <>
      <Head>
        <title>Flickington</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Flickington</h1>
        <h2>{movie.title}</h2>
        <p>{movie.overview}</p>
      </main>
    </>
  );
}
