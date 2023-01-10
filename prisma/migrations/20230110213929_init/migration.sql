-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "release_date" TIMESTAMP(3),
    "language" TEXT NOT NULL,
    "providers" INTEGER[],
    "genres" INTEGER[],

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);
